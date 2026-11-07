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

use log::{info, warn};
use std::io;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::LOG_TARGET_APP_LOGIC;
use crate::consts::PROCESS_CREATION_NO_WINDOW;

/// Splits verbose `netsh show rule` output into one `(is_allow, program)` pair per record.
fn parse_netsh_rules(stdout: &str) -> Vec<(bool, Option<String>)> {
    let mut records: Vec<(bool, Option<String>)> = Vec::new();
    for line in stdout.lines() {
        if let Some((key, value)) = line.trim().split_once(':') {
            let value = value.trim();
            match (key.trim(), records.last_mut()) {
                ("Rule Name", _) => records.push((false, None)),
                ("Action", Some(record)) => record.0 = value.eq_ignore_ascii_case("Allow"),
                ("Program", Some(record)) => record.1 = Some(value.to_string()),
                _ => {}
            }
        }
    }
    records
}

/// Returns whether an Allow rule already covers `expected_program`, plus the programs whose
/// same-named Allow rules are stale and safe to delete. `netsh delete rule` cannot filter by
/// action, so a program shared with any non-Allow record (an administrator's Block rule, say)
/// is never returned, nor is a record without a concrete program.
fn plan_stale_rule_cleanup(stdout: &str, expected_program: &str) -> (bool, Vec<String>) {
    let records = parse_netsh_rules(stdout);
    let same = |a: &str, b: &str| a.eq_ignore_ascii_case(b);
    let allows_current = records
        .iter()
        .any(|(allow, prog)| *allow && prog.as_deref().is_some_and(|p| same(p, expected_program)));
    let mut stale: Vec<String> = Vec::new();
    for (allow, prog) in &records {
        let Some(prog) = prog
            .as_deref()
            .filter(|p| *allow && !p.is_empty() && !same(p, "Any"))
        else {
            continue;
        };
        let shared_with_non_allow = records
            .iter()
            .any(|(a, p)| !*a && p.as_deref().is_none_or(|p| same(p, prog) || same(p, "Any")));
        if !same(prog, expected_program)
            && !shared_with_non_allow
            && !stale.iter().any(|s| same(s, prog))
        {
            stale.push(prog.to_string());
        }
    }
    (allows_current, stale)
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

fn check_netsh_rule_exists(rule_name: &str, expected_program: &str) -> (bool, Vec<String>) {
    let output = match Command::new("netsh")
        .arg("advfirewall")
        .arg("firewall")
        .arg("show")
        .arg("rule")
        .arg(format!("name={rule_name}"))
        .arg("dir=in")
        .arg("verbose")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .creation_flags(PROCESS_CREATION_NO_WINDOW)
        .output()
    {
        Ok(output) => output,
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to execute netsh command: {e}");
            return (false, Vec::new());
        }
    };

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        return plan_stale_rule_cleanup(&stdout, expected_program);
    }
    (false, Vec::new())
}

/// Runs `netsh advfirewall firewall <args>`; returns `Err` with netsh's stdout and stderr
/// (netsh writes most errors to stdout) or the spawn error.
fn run_netsh(args: &[&str]) -> Result<(), String> {
    let output = Command::new("netsh")
        .args(["advfirewall", "firewall"])
        .args(args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .creation_flags(PROCESS_CREATION_NO_WINDOW)
        .output()
        .map_err(|e| format!("failed to execute netsh: {e}"))?;
    if output.status.success() {
        return Ok(());
    }
    Err(format!(
        "{}, stdout: {}, stderr: {}",
        output.status,
        String::from_utf8_lossy(&output.stdout).trim(),
        String::from_utf8_lossy(&output.stderr).trim()
    ))
}

/// Ensures an inbound allow rule exists for the current executable. Failures are logged,
/// never returned: a missing inbound rule must not stop the miner or node from starting.
pub fn add_firewall_rule(binary_name: String, binary_path: PathBuf) {
    let program_arg = match format_program_arg(&binary_path) {
        Ok(arg) => arg,
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Skipping firewall rule for {binary_name}: {e}");
            return;
        }
    };
    let expected_program = program_arg.strip_prefix("program=").unwrap_or(&program_arg);
    let (allows_current_program, stale_programs) =
        check_netsh_rule_exists(&binary_name, expected_program);
    if allows_current_program {
        info!(target: LOG_TARGET_APP_LOGIC, "Firewall rule already exists.");
        return;
    }

    let name_arg = format!("name={binary_name}");
    // Delete only same-named inbound Allow rules for older install paths. Filtering by program
    // leaves Block rules and rules for other programs in place.
    for stale in &stale_programs {
        let stale_arg = format!("program={stale}");
        match run_netsh(&["delete", "rule", &name_arg, "dir=in", &stale_arg]) {
            Ok(()) => {
                info!(target: LOG_TARGET_APP_LOGIC, "Deleted stale firewall rule {binary_name} for {stale}.")
            }
            Err(e) => {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to delete stale firewall rule {binary_name} for {stale}: {e}")
            }
        }
    }

    // Add a firewall rule to allow inbound connections
    match run_netsh(&[
        "add",
        "rule",
        &name_arg,
        "dir=in",
        "action=allow",
        &program_arg,
        "profile=public",
    ]) {
        Ok(()) => info!(target: LOG_TARGET_APP_LOGIC, "Firewall rule added successfully."),
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to add firewall rule {binary_name}: {e}")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{format_program_arg, plan_stale_rule_cleanup};
    use std::path::Path;

    #[test]
    fn parses_netsh_allow_output_and_rejects_block_or_empty() {
        let sample_allow = "Rule Name:                            minotari_node\r\n                            Enabled:                              Yes\r\n                            Direction:                            In\r\n                            Profiles:                             Public\r\n                            Program:                              C:\\Tari\\new.exe\r\n                            Action:                               Allow\r\n";
        assert_eq!(
            plan_stale_rule_cleanup(sample_allow, r"C:\Tari\new.exe"),
            (true, vec![])
        );
        assert_eq!(
            plan_stale_rule_cleanup(sample_allow, r"C:\Tari\old.exe"),
            (false, vec![r"C:\Tari\new.exe".to_string()])
        );

        let sample_block = "Rule Name:                            minotari_node\r\n                            Action:                               Block\r\n";
        assert_eq!(
            plan_stale_rule_cleanup(sample_block, r"C:\Tari\new.exe"),
            (false, vec![])
        );
        assert_eq!(
            plan_stale_rule_cleanup("", r"C:\Tari\new.exe"),
            (false, vec![])
        );
    }

    #[test]
    fn test_parse_netsh_allow_rule_non_verbose_output_has_allow_but_no_match() {
        let sample = "\r\nRule Name:                            tari_c29_pool_miner_sm_86.exe\r\n----------------------------------------------------------------------\r\nEnabled:                              Yes\r\nDirection:                            In\r\nProfiles:                             Public\r\nGrouping:                             \r\nLocalIP:                              Any\r\nRemoteIP:                             Any\r\nProtocol:                             Any\r\nEdge traversal:                       No\r\nAction:                               Allow\r\nOk.\r\n\r\n";
        assert_eq!(
            plan_stale_rule_cleanup(sample, r"C:\Tari\tari_c29_pool_miner_sm_86.exe"),
            (false, vec![])
        );
    }

    #[test]
    fn test_parse_netsh_allow_rule_verbose_duplicate_rules_matches_current_program() {
        let sample = "\r\nRule Name:                            tari_c29_pool_miner_sm_86.exe\r\n----------------------------------------------------------------------\r\nEnabled:                              Yes\r\nDirection:                            In\r\nProfiles:                             Public\r\nGrouping:                             \r\nLocalIP:                              Any\r\nRemoteIP:                             Any\r\nProtocol:                             Any\r\nEdge traversal:                       No\r\nProgram:                              C:\\Tari\\old\\tari_c29_pool_miner_sm_86.exe.exe\r\nInterfaceTypes:                       Any\r\nSecurity:                             NotRequired\r\nRule source:                          Local Setting\r\nAction:                               Allow\r\n\r\nRule Name:                            tari_c29_pool_miner_sm_86.exe\r\n----------------------------------------------------------------------\r\nEnabled:                              Yes\r\nDirection:                            In\r\nProfiles:                             Public\r\nGrouping:                             \r\nLocalIP:                              Any\r\nRemoteIP:                             Any\r\nProtocol:                             Any\r\nEdge traversal:                       No\r\nProgram:                              C:\\Tari\\current\\tari_c29_pool_miner_sm_86.exe\r\nInterfaceTypes:                       Any\r\nSecurity:                             NotRequired\r\nRule source:                          Local Setting\r\nAction:                               Allow\r\nOk.\r\n\r\n";
        assert_eq!(
            plan_stale_rule_cleanup(sample, r"C:\Tari\current\tari_c29_pool_miner_sm_86.exe"),
            (
                true,
                vec![r"C:\Tari\old\tari_c29_pool_miner_sm_86.exe.exe".to_string()]
            )
        );
        assert_eq!(
            plan_stale_rule_cleanup(sample, r"C:\Tari\other\tari_c29_pool_miner_sm_86.exe"),
            (
                false,
                vec![
                    r"C:\Tari\old\tari_c29_pool_miner_sm_86.exe.exe".to_string(),
                    r"C:\Tari\current\tari_c29_pool_miner_sm_86.exe".to_string()
                ]
            )
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

    #[test]
    fn stale_cleanup_never_deletes_programs_shared_with_block_rules() {
        let record = |program: &str, action: &str| {
            format!(
                "Rule Name:   minotari_node.exe\r\nDirection:   In\r\nProgram:     {program}\r\nAction:      {action}\r\n\r\n"
            )
        };
        let blocked_stale = format!(
            "{}{}{}Ok.\r\n",
            record(r"C:\Tari\old\minotari_node.exe", "Allow"),
            record(r"C:\Tari\old\minotari_node.exe", "Block"),
            record(r"C:\Tari\older\minotari_node.exe", "Allow"),
        );
        assert_eq!(
            plan_stale_rule_cleanup(&blocked_stale, r"C:\Tari\new\minotari_node.exe"),
            (false, vec![r"C:\Tari\older\minotari_node.exe".to_string()])
        );

        let block_any = format!(
            "{}{}",
            record(r"C:\Tari\old\minotari_node.exe", "Allow"),
            record("Any", "Block"),
        );
        assert_eq!(
            plan_stale_rule_cleanup(&block_any, r"C:\Tari\new\minotari_node.exe"),
            (false, vec![])
        );
    }
}
