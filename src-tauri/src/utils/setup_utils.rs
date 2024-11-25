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
