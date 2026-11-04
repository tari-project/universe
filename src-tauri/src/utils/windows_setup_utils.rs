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

use log::{error, info, warn};
use std::io::{self, Write};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::LOG_TARGET_APP_LOGIC;
use crate::consts::PROCESS_CREATION_NO_WINDOW;

fn parse_netsh_allow_rule(stdout: &str, expected_program: &str) -> (bool, bool) {
    let mut has_allow = false;
    let mut matching = false;
    let mut allow = false;
    let mut current_program = false;
    for line in stdout.lines() {
        if let Some((key, value)) = line.trim().split_once(':') {
            match key.trim() {
                "Rule Name" => {
                    has_allow |= allow;
                    matching |= allow && current_program;
                    allow = false;
                    current_program = false;
                }
                "Action" => allow = value.trim().eq_ignore_ascii_case("Allow"),
                "Program" => current_program = value.trim().eq_ignore_ascii_case(expected_program),
                _ => {}
            }
        }
    }
    has_allow |= allow;
    matching |= allow && current_program;
    (has_allow, matching)
}

fn format_program_arg(binary_path: &Path) -> io::Result<String> {
    let path_str = binary_path.to_str().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            "Binary path contains invalid UTF-8",
        )
    })?;
    let has_exe_ext = binary_path
        .extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("exe"));
    if has_exe_ext {
        Ok(format!("program={path_str}"))
    } else {
        Ok(format!("program={path_str}.exe"))
    }
}

fn check_netsh_rule_exists(rule_name: &str, expected_program: &str) -> (bool, bool) {
    let output = match Command::new("netsh")
        .arg("advfirewall")
        .arg("firewall")
        .arg("show")
        .arg("rule")
        .arg(format!("name={rule_name}"))
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .creation_flags(PROCESS_CREATION_NO_WINDOW)
        .output()
    {
        Ok(output) => output,
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to execute netsh command: {e}");
            return (false, false);
        }
    };

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        return parse_netsh_allow_rule(&stdout, expected_program);
    }
    (false, false)
}

pub fn add_firewall_rule(binary_name: String, binary_path: PathBuf) -> io::Result<()> {
    let program_arg = format_program_arg(&binary_path)?;
    let expected_program = program_arg.strip_prefix("program=").unwrap_or(&program_arg);
    let (has_allow_rule, allows_current_program) =
        check_netsh_rule_exists(&binary_name, expected_program);
    if allows_current_program {
        info!(target: LOG_TARGET_APP_LOGIC, "Firewall rule already exists.");
    } else {
        if has_allow_rule {
            // Update a named inbound allow rule whose executable changed with a binary update.
            let updated = Command::new("netsh")
                .args([
                    "advfirewall",
                    "firewall",
                    "set",
                    "rule",
                    &format!("name={binary_name}"),
                    "dir=in",
                    "action=allow",
                    "new",
                    &program_arg,
                ])
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::piped())
                .creation_flags(PROCESS_CREATION_NO_WINDOW)
                .output()?;
            if updated.status.success() {
                info!(target: LOG_TARGET_APP_LOGIC, "Firewall rule updated for current executable.");
                return Ok(());
            }
            return Err(io::Error::other(format!(
                "Failed to update stale firewall rule: {}",
                String::from_utf8_lossy(&updated.stderr)
            )));
        }

        // Add a firewall rule to allow inbound connections
        let output = Command::new("netsh")
            .args([
                "advfirewall",
                "firewall",
                "add",
                "rule",
                &format!("name={binary_name}"),
                "dir=in",
                "action=allow",
                &program_arg,
                "profile=public",
            ])
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output()?;

        if output.status.success() {
            info!(target: LOG_TARGET_APP_LOGIC, "Firewall rule added successfully.");
        } else {
            io::stderr().write_all(&output.stderr)?;
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to add firewall rule.");
            return Err(io::Error::other("Failed to add firewall rule"));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{format_program_arg, parse_netsh_allow_rule};
    use std::path::Path;

    #[test]
    fn parses_netsh_allow_output_and_rejects_block_or_empty() {
        let sample_allow = "Rule Name:                            minotari_node\r\n                            Enabled:                              Yes\r\n                            Direction:                            In\r\n                            Profiles:                             Public\r\n                            Program:                              C:\\Tari\\new.exe\r\n                            Action:                               Allow\r\n";
        assert_eq!(
            parse_netsh_allow_rule(sample_allow, r"C:\Tari\new.exe"),
            (true, true)
        );
        assert_eq!(
            parse_netsh_allow_rule(sample_allow, r"C:\Tari\old.exe"),
            (true, false)
        );

        let sample_block = "Rule Name:                            minotari_node\r\n                            Action:                               Block\r\n";
        assert_eq!(
            parse_netsh_allow_rule(sample_block, r"C:\Tari\new.exe"),
            (false, false)
        );
        assert_eq!(
            parse_netsh_allow_rule("", r"C:\Tari\new.exe"),
            (false, false)
        );
    }

    #[test]
    fn format_program_arg_does_not_duplicate_exe_suffix() {
        assert_eq!(
            format_program_arg(Path::new(r"C:\Tari\minotari_node.exe")).unwrap(),
            r"program=C:\Tari\minotari_node.exe"
        );
        assert_eq!(
            format_program_arg(Path::new(r"C:\Tari\minotari_node")).unwrap(),
            r"program=C:\Tari\minotari_node.exe"
        );
    }
}
