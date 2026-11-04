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

use anyhow::{Error, anyhow};
use log::{info, warn};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::LOG_TARGET_APP_LOGIC;
use crate::consts::PROCESS_CREATION_NO_WINDOW;
use crate::utils::platform_utils::{CurrentOperatingSystem, PlatformUtils};

pub struct WindowsDefenderExclusions {}

fn build_add_exclusion_command(path: &Path) -> Result<(String, String), Error> {
    let path_str = path
        .to_str()
        .ok_or_else(|| anyhow!("Failed to convert path to string: {:?}", path))?;
    if path_str.is_empty() || path_str.contains(['\0', '\r', '\n']) {
        return Err(anyhow!(
            "Refusing to pass invalid or control-character path to PowerShell: {:?}",
            path
        ));
    }
    let escaped = path_str.replace('\'', "''");
    Ok((
        path_str.to_string(),
        format!("Add-MpPreference -ExclusionPath '{escaped}'"),
    ))
}

impl WindowsDefenderExclusions {
    /// Adds a specific binary file to Windows Defender exclusions. If the file is already excluded, it logs this and
    /// returns Ok(()). If the command fails for other reasons, it returns an error.
    fn add_binary_to_exclusions(binary_path: &PathBuf) -> Result<(), Error> {
        let (path_str, ps_command) = build_add_exclusion_command(binary_path)?;

        let path_str = path_str.replace('\'', "''");

        info!(target: LOG_TARGET_APP_LOGIC, "Adding binary to Windows Defender exclusions: {path_str}");

        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &ps_command])
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output()
            .map_err(|e| anyhow!("Failed to execute PowerShell command: {e}"))?;

        if output.status.success() {
            info!(target: LOG_TARGET_APP_LOGIC, "Successfully added binary to Windows Defender exclusions: {path_str}");
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Check if it's already excluded (not an error)
            if stderr.contains("already exists") || stdout.contains("already exists") {
                info!(target: LOG_TARGET_APP_LOGIC, "Binary already in Windows Defender exclusions: {path_str}");
                return Ok(());
            }

            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to add binary to Windows Defender exclusions. stdout: {stdout}, stderr: {stderr}");
            Err(anyhow!(
                "Failed to add binary to Windows Defender exclusions: {path_str}. Error: {stderr}"
            ))
        }
    }

    /// Checks if Windows Defender is available by running a PowerShell command.
    fn is_windows_defender_available() -> bool {
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-MpComputerStatus | Select-Object -ExpandProperty AntivirusEnabled",
            ])
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output();

        match output {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout);
                stdout.trim() == "True"
            }
            Err(e) => {
                info!(target: LOG_TARGET_APP_LOGIC, "Failed to check Windows Defender status: {e}");
                false
            }
        }
    }

    /// Adds only an existing verified final executable to Windows Defender exclusions.
    /// If Windows Defender is not available or the OS is not Windows, the function will log this and return Ok(()).
    pub fn add_verified_binary_exclusion(binary_path: &PathBuf) -> Result<(), Error> {
        if !matches!(
            PlatformUtils::detect_current_os(),
            CurrentOperatingSystem::Windows
        ) {
            info!(target: LOG_TARGET_APP_LOGIC, "Skipping Windows Defender exclusions on non-Windows platform");
            return Ok(());
        }

        let network = tari_common::configuration::Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        crate::executable_integrity::verify_launch_path(binary_path, &network)?;

        // Check if Windows Defender is available
        if !Self::is_windows_defender_available() {
            info!(target: LOG_TARGET_APP_LOGIC, "Windows Defender is not available or disabled");
            return Ok(());
        }

        Self::add_binary_to_exclusions(binary_path)
    }
}

#[cfg(test)]
mod tests {
    use super::{WindowsDefenderExclusions, build_add_exclusion_command};
    use std::path::Path;

    #[test]
    fn unpinned_file_cannot_receive_defender_exclusion() {
        let file = tempfile::NamedTempFile::new().expect("create unpinned fixture");
        assert!(
            WindowsDefenderExclusions::add_verified_binary_exclusion(&file.path().to_path_buf())
                .is_err()
        );
    }

    #[test]
    fn escapes_single_quotes_in_windows_paths() {
        let path = Path::new(r"C:\Users\O'Connor\AppData\Local\tari\minotari_node.exe");
        let (_, cmd) = build_add_exclusion_command(path).expect("valid path");
        assert_eq!(
            cmd,
            r"Add-MpPreference -ExclusionPath 'C:\Users\O''Connor\AppData\Local\tari\minotari_node.exe'"
        );
    }

    #[test]
    fn neutralizes_single_quote_command_injection_breakout() {
        let path = Path::new("C:\\temp\\pwn'; Start-Process calc.exe; #");
        let (_, cmd) = build_add_exclusion_command(path).expect("escaped path");
        assert_eq!(
            cmd,
            "Add-MpPreference -ExclusionPath 'C:\\temp\\pwn''; Start-Process calc.exe; #'"
        );
    }

    #[test]
    fn rejects_control_characters_and_empty_paths() {
        assert!(build_add_exclusion_command(Path::new("")).is_err());
        assert!(build_add_exclusion_command(Path::new("C:\\temp\\bad\npath")).is_err());
        assert!(build_add_exclusion_command(Path::new("C:\\temp\\bad\rpath")).is_err());
    }
}
