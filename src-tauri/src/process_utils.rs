// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use std::{fs, future::Future, io::Write, path::Path, pin::Pin, time::Duration};

use crate::process_adapter::ProcessStartupSpec;
use crate::process_wrapper;

pub fn launch_child_process(
    file_path: &Path,
    current_dir: &Path,
    envs: Option<&std::collections::HashMap<String, String>>,
    args: &[String],
    allow_output: bool,
) -> Result<tokio::process::Child, anyhow::Error> {
    let stdout = if allow_output {
        std::process::Stdio::piped()
    } else {
        std::process::Stdio::null()
    };
    let stderr = if allow_output {
        std::process::Stdio::piped()
    } else {
        std::process::Stdio::null()
    };

    let (actual_binary, actual_args) =
        if let Some(wrapper_path) = process_wrapper::get_wrapper_path() {
            let parent_pid = std::process::id().to_string();
            let mut wrapper_args = vec![parent_pid, file_path.to_string_lossy().to_string()];
            wrapper_args.extend(args.iter().cloned());
            (wrapper_path, wrapper_args)
        } else {
            (file_path.to_path_buf(), args.to_vec())
        };

    #[cfg(not(target_os = "windows"))]
    {
        Ok(tokio::process::Command::new(&actual_binary)
            .args(&actual_args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            .stdout(stdout)
            .stderr(stderr)
            .kill_on_drop(true)
            .spawn()?)
    }
    #[cfg(target_os = "windows")]
    {
        use crate::consts::PROCESS_CREATION_NO_WINDOW;

        Ok(tokio::process::Command::new(&actual_binary)
            .args(&actual_args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            .stdout(stdout)
            .stderr(stderr)
            .kill_on_drop(true)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()?)
    }
}

// pub async fn launch_and_get_outputs(
//     file_path: &Path,
//     args: Vec<String>,
// ) -> Result<Vec<u8>, anyhow::Error> {
//     #[cfg(not(target_os = "windows"))]
//     {
//         let child = tokio::process::Command::new(file_path)
//             .args(args)
//             .stdout(std::process::Stdio::piped())
//             .kill_on_drop(true)
//             .spawn()?;

//         let output = child.wait_with_output().await?;
//         Ok(output.stdout.as_slice().to_vec())
//     }

//     #[cfg(target_os = "windows")]
//     {
//         use crate::consts::PROCESS_CREATION_NO_WINDOW;
//         let child = tokio::process::Command::new(file_path)
//             .args(args)
//             .stdout(std::process::Stdio::piped())
//             .kill_on_drop(true)
//             .creation_flags(PROCESS_CREATION_NO_WINDOW)
//             .spawn()?;

//         let output = child.wait_with_output().await?;
//         Ok(output.stdout.as_slice().to_vec())
//     }
// }

pub async fn retry_with_backoff<T, R, E>(
    mut f: T,
    increment_in_secs: u64,
    max_retries: u64,
    operation_name: &str,
) -> anyhow::Result<R>
where
    T: FnMut() -> Pin<Box<dyn Future<Output = Result<R, E>> + Send>>,
    E: std::error::Error,
{
    let range_size = increment_in_secs * max_retries + 1;

    for i in (0..range_size).step_by(usize::try_from(increment_in_secs)?) {
        tokio::time::sleep(Duration::from_secs(i)).await;

        let result = f().await;
        match result {
            Ok(res) => return Ok(res),
            Err(e) => {
                if i == range_size - 1 {
                    return Err(anyhow::anyhow!(
                        "Max retries reached, {} failed. Last error: {:?}",
                        operation_name,
                        e
                    ));
                }
            }
        }
    }
    Err(anyhow::anyhow!(
        "Max retries reached, {} failed without capturing error",
        operation_name
    ))
}

pub fn write_pid_file(spec: &ProcessStartupSpec, id: u32) -> Result<(), String> {
    let mut file = fs::File::create(spec.data_dir.join(spec.pid_file_name.clone()))
        .map_err(|e| format!("Failed to create PID file: {e}"))?;
    file.write_all(id.to_string().as_bytes())
        .map_err(|e| format!("Failed to write PID file: {e}"))?;
    file.flush()
        .map_err(|e| format!("Failed to flush PID file: {e}"))?;
    Ok(())
}

/// Time to wait for graceful shutdown before sending SIGKILL.
const GRACEFUL_SHUTDOWN_WAIT_SECS: u64 = 2;

/// Gracefully terminate a child process.
/// Sends SIGTERM first (so the process-wrapper can catch it and clean up),
/// waits for graceful shutdown, then falls back to SIGKILL if needed.
pub async fn graceful_kill(child: &mut tokio::process::Child) -> Result<(), std::io::Error> {
    if let Some(pid) = child.id() {
        #[cfg(unix)]
        {
            use nix::sys::signal::{kill, Signal};
            use nix::unistd::Pid;

            let _ = kill(Pid::from_raw(pid.cast_signed()), Signal::SIGTERM);

            tokio::time::sleep(Duration::from_secs(GRACEFUL_SHUTDOWN_WAIT_SECS)).await;

            if let Ok(Some(_)) = child.try_wait() {
                return Ok(());
            }

            child.kill().await?;
        }

        #[cfg(windows)]
        {
            child.kill().await?;
        }
    } else {
        child.kill().await?;
    }

    Ok(())
}
