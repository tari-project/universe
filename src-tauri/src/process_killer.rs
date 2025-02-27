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

use anyhow::Result;
use nix::sys::wait::{waitpid, WaitStatus};
use tokio::task;

pub async fn kill_process(pid: i32) -> Result<(), anyhow::Error> {
    #[cfg(target_os = "windows")]
    {
        use crate::consts::PROCESS_CREATION_NO_WINDOW;
        use anyhow::Context;
        let command = format!("taskkill /F /PID {}", pid);

        let mut child = tokio::process::Command::new("cmd")
            .arg("/C")
            .arg(command)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()
            .context(format!("Failed to start taskkill for PID {}: {}", pid, pid))?;

        child.wait().await?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;

        let pid = Pid::from_raw(pid);

        signal::kill(pid, Signal::SIGTERM)?;
        task::spawn_blocking(move || loop {
            match waitpid(pid, None) {
                Ok(WaitStatus::Exited(_, status)) => return Some(status),
                Ok(WaitStatus::Signaled(_, _, _)) => {
                    return None;
                }
                Ok(_) => std::thread::sleep(std::time::Duration::from_millis(100)),
                Err(_) => return None,
            }
        })
        .await?;

        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    Ok(())
}
