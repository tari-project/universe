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

use anyhow::{anyhow, Error};
use log::{info, warn};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Command;

use crate::consts::PROCESS_CREATION_NO_WINDOW;
use crate::utils::platform_utils::{CurrentOperatingSystem, PlatformUtils};

pub const LOG_TARGET: &str = "tari::universe::windows_defender";

pub struct WindowsDefenderExclusions {}

impl WindowsDefenderExclusions {
    /// Adds a specific binary file to Windows Defender exclusions. If the file is already excluded, it logs this and
    /// returns Ok(()). If the command fails for other reasons, it returns an error.
    fn add_binary_to_exclusions(binary_path: &PathBuf) -> Result<(), Error> {
        let path_str = binary_path
            .to_str()
            .ok_or_else(|| anyhow!("Failed to convert path to string: {:?}", binary_path))?;

        info!(target: LOG_TARGET, "Adding binary to Windows Defender exclusions: {path_str}");

        let output = Command::new("powershell")
            .args([
                "-Command",
                &format!("Add-MpPreference -ExclusionPath '{path_str}'"),
            ])
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output()
            .map_err(|e| anyhow!("Failed to execute PowerShell command: {e}"))?;

        if output.status.success() {
            info!(target: LOG_TARGET, "Successfully added binary to Windows Defender exclusions: {path_str}");
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Check if it's already excluded (not an error)
            if stderr.contains("already exists") || stdout.contains("already exists") {
                info!(target: LOG_TARGET, "Binary already in Windows Defender exclusions: {path_str}");
                return Ok(());
            }

            warn!(target: LOG_TARGET, "Failed to add binary to Windows Defender exclusions. stdout: {stdout}, stderr: {stderr}");
            Err(anyhow!(
                "Failed to add binary to Windows Defender exclusions: {path_str}. Error: {stderr}"
            ))
        }
    }

    /// Adds a directory to Windows Defender exclusions. If the directory is already excluded, it logs this and returns Ok(()).
    /// If the command fails for other reasons, it returns an error.
    fn add_directory_to_exclusions(dir_path: &PathBuf) -> Result<(), Error> {
        let path_str = dir_path
            .to_str()
            .ok_or_else(|| anyhow!("Failed to convert directory path to string: {:?}", dir_path))?;

        info!(target: LOG_TARGET, "Adding directory to Windows Defender exclusions: {path_str}");

        let output = Command::new("powershell")
            .args([
                "-Command",
                &format!("Add-MpPreference -ExclusionPath '{path_str}'"),
            ])
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .output()
            .map_err(|e| anyhow!("Failed to execute PowerShell command: {e}"))?;

        if output.status.success() {
            info!(target: LOG_TARGET, "Successfully added directory to Windows Defender exclusions: {path_str}");
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            if stderr.contains("already exists") || stdout.contains("already exists") {
                info!(target: LOG_TARGET, "Directory already in Windows Defender exclusions: {path_str}");
                return Ok(());
            }

            warn!(target: LOG_TARGET, "Failed to add directory to Windows Defender exclusions. stdout: {stdout}, stderr: {stderr}");
            Err(anyhow!(
                "Failed to add directory to Windows Defender exclusions: {path_str}. Error: {stderr}",
            ))
        }
    }

    /// Checks if Windows Defender is available by running a PowerShell command.
    fn is_windows_defender_available() -> bool {
        let output = Command::new("powershell")
            .args([
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
                info!(target: LOG_TARGET, "Failed to check Windows Defender status: {e}");
                false
            }
        }
    }

    /// Windows Only: Adds comprehensive exclusions for the specified binary and its parent directory to Windows Defender.
    /// If Windows Defender is not available or the OS is not Windows, the function will log this and return Ok(()).
    pub fn add_comprehensive_exclusions(binary_path: &PathBuf) -> Result<(), Error> {
        if !matches!(
            PlatformUtils::detect_current_os(),
            CurrentOperatingSystem::Windows
        ) {
            info!(target: LOG_TARGET, "Skipping Windows Defender exclusions on non-Windows platform");
            return Ok(());
        }

        // Check if Windows Defender is available
        if !Self::is_windows_defender_available() {
            info!(target: LOG_TARGET, "Windows Defender is not available or disabled");
            return Ok(());
        }

        // Add the specific binary file
        if let Err(e) = Self::add_binary_to_exclusions(binary_path) {
            warn!(target: LOG_TARGET, "Failed to add binary exclusion for {}: {e}", binary_path.display());
        }

        // Add the parent directory
        if let Some(parent_dir) = binary_path.parent() {
            if let Err(e) = Self::add_directory_to_exclusions(&parent_dir.to_path_buf()) {
                warn!(target: LOG_TARGET, "Failed to add directory exclusion for {}: {e}", parent_dir.display());
            }
        }

        Ok(())
    }
}
