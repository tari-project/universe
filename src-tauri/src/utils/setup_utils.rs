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

#[cfg(windows)]
pub mod setup_utils {
    use log::{error, info};
    use std::io::{self, Write};
    use std::os::windows::process::CommandExt;
    use std::path::PathBuf;
    use std::process::Command;

    use crate::consts::PROCESS_CREATION_NO_WINDOW;

    const LOG_TARGET: &str = "tari::universe::setup_utils";

    fn check_netsh_rule_exists(rule_name: String) -> bool {
        let output = Command::new("netsh")
            .arg("advfirewall")
            .arg("firewall")
            .arg("show")
            .arg("rule")
            .arg(format!("name={}", rule_name))
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output()
            .expect("Failed to execute netsh command");

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let lines: Vec<&str> = stdout.split('\n').collect();
            for line in lines {
                if line.contains("Action:") {
                    let action = line.split(':').nth(1).unwrap_or("").trim();
                    if action == "Allow" {
                        return true;
                    }
                }
            }
        }
        false
    }

    pub fn add_firewall_rule(binary_name: String, binary_path: PathBuf) -> io::Result<()> {
        if !check_netsh_rule_exists(binary_name.clone()) {
            // Add a firewall rule to allow inbound connections
            let output = Command::new("netsh")
                .args(&[
                    "advfirewall",
                    "firewall",
                    "add",
                    "rule",
                    &format!("name={}", binary_name),
                    "dir=in",
                    "action=allow",
                    &format!(
                        "program={}.exe",
                        &binary_path.to_str().expect("Could not get binary path")
                    ),
                    "profile=public",
                ])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::piped())
                .creation_flags(PROCESS_CREATION_NO_WINDOW)
                .output()?;

            if output.status.success() {
                info!(target: LOG_TARGET, "Firewall rule added successfully.");
            } else {
                io::stderr().write_all(&output.stderr)?;
                error!(target: LOG_TARGET, "Failed to add firewall rule.");
            }
        } else {
            info!(target: LOG_TARGET, "Firewall rule already exists.");
        }

        Ok(())
    }
}
