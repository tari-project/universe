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

use std::{future::Future, path::Path, pin::Pin, time::Duration};

pub fn launch_child_process(
    file_path: &Path,
    current_dir: &Path,
    envs: Option<&std::collections::HashMap<String, String>>,
    args: &[String],
) -> Result<tokio::process::Child, anyhow::Error> {
    #[cfg(not(target_os = "windows"))]
    {
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            // .stdout(std::process::Stdio::null()) // TODO: uncomment, only for testing
            // .stderr(std::process::Stdio::null()) // TODO: uncomment, only for testing
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true)
            .spawn()?)
    }
    #[cfg(target_os = "windows")]
    {
        use crate::consts::PROCESS_CREATION_NO_WINDOW;
        Ok(tokio::process::Command::new(file_path)
            .args(args)
            .current_dir(current_dir)
            .envs(envs.cloned().unwrap_or_default())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
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
