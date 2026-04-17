// Copyright 2026. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
// disclaimer in the documentation and/or other materials provided with the distribution.
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
use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_core::ConfigCore;
use crate::setup::setup_manager::{SetupManager, SetupPhase};
use dunce::canonicalize;
use fs_more::directory::{
    BrokenSymlinkBehaviour, CollidingSubDirectoryBehaviour, DestinationDirectoryRule,
    DirectoryMoveAllowedStrategies, DirectoryMoveByCopyOptions, DirectoryMoveOptions,
    SymlinkBehaviour, move_directory,
};
use fs_more::file::CollidingFileBehaviour;
use log::{error, info, warn};
use std::fs;
use std::path::Path;
use tari_common::configuration::Network;
use tauri::ipc::InvokeError;

/// Check if a path is on a network/SMB mount on macOS.
/// Returns true if the path is on a network filesystem.
#[cfg(target_os = "macos")]
fn is_network_mount(path: &Path) -> bool {
    use std::process::Command;

    // Use stat -f to get filesystem type
    match Command::new("stat")
        .args(["-f", "%T", path.to_str().unwrap_or("")])
        .output()
    {
        Ok(output) => {
            let fs_type = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
            // SMB mounts show as "smbfs", NFS as "nfs", AFP as "afpfs", WebDAV as "webdav"
            matches!(fs_type.as_str(), "smbfs" | "nfs" | "afpfs" | "webdav")
        }
        Err(e) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not determine filesystem type for {}: {}", path.display(), e);
            false
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn is_network_mount(_path: &Path) -> bool {
    // On non-macOS platforms, we don't check for network mounts
    // Linux can check /proc/mounts or use statvfs, but for now we skip
    false
}

/// Check if a path is writable and suitable for node data storage.
/// Returns an error message if the path is not suitable.
pub fn validate_destination_path(path: &Path) -> Result<(), InvokeError> {
    // Check if the path exists
    if !path.exists() {
        return Err(InvokeError::from(format!(
            "Destination directory does not exist: {}",
            path.display()
        )));
    }

    // Check if it's a directory
    if !path.is_dir() {
        return Err(InvokeError::from(format!(
            "Destination path is not a directory: {}",
            path.display()
        )));
    }

    // Check for network mount (currently only on macOS)
    if is_network_mount(path) {
        return Err(InvokeError::from(
            "Network-mounted directories (SMB/NFS/AFP/WebDAV) are not supported as node data locations. \
             Please choose a local directory instead. \
             Network mounts may not support the required file operations and permissions."
                .to_string(),
        ));
    }

    // Try to create a test file to verify write permissions
    let test_file = path.join(".tari_write_test");
    match fs::write(&test_file, "test") {
        Ok(_) => {
            let _ = fs::remove_file(&test_file);
            Ok(())
        }
        Err(e) => Err(InvokeError::from(format!(
            "Cannot write to destination directory {}: {}",
            path.display(),
            e
        ))),
    }
}

pub async fn update_data_location(to_path: String) -> Result<(), InvokeError> {
    let move_options = DirectoryMoveOptions {
        destination_directory_rule: DestinationDirectoryRule::AllowNonEmpty {
            colliding_file_behaviour: CollidingFileBehaviour::Abort,
            colliding_subdirectory_behaviour: CollidingSubDirectoryBehaviour::Continue,
        },
        allowed_strategies: DirectoryMoveAllowedStrategies::Either {
            copy_and_delete_options: DirectoryMoveByCopyOptions {
                broken_symlink_behaviour: BrokenSymlinkBehaviour::Abort,
                symlink_behaviour: SymlinkBehaviour::Keep,
            },
        },
    };
    match canonicalize(&to_path) {
        Ok(new_dir) => {
            // Validate the destination path before proceeding
            validate_destination_path(&new_dir)?;

            match ConfigCore::update_node_data_directory(new_dir.clone()).await {
                Ok(previous) => {
                    if let Some(previous) = previous {
                        SetupManager::get_instance()
                            .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
                            .await;

                        let network = Network::get_current().to_string().to_lowercase();
                        let source_dir = previous.join("node").join(&network);
                        let destination_dir = new_dir.join("node").join(&network);

                        if let Some(parent) = destination_dir.parent() {
                            fs::create_dir_all(parent).map_err(|e| InvokeError::from(e.to_string()))?;
                        }

                        let dest_existed = destination_dir.exists();

                        match move_directory(source_dir, destination_dir.clone(), move_options) {
                            Ok(res) => {
                                info!(target: LOG_TARGET_APP_LOGIC, "Successfully moved items - Total bytes: {}, Directories: {:?}", res.total_bytes_moved, res.directories_moved);
                            }
                            Err(e) => {
                                error!(target: LOG_TARGET_APP_LOGIC, "Could not move items, reverting config change: {e}");

                                if !dest_existed
                                    && destination_dir.exists()
                                    && let Err(cleanup_err) = fs::remove_dir_all(&destination_dir)
                                {
                                    warn!(target: LOG_TARGET_APP_LOGIC, "Failed to clean up destination after failed move: {cleanup_err}");
                                }

                                ConfigCore::update_node_data_directory(previous)
                                    .await
                                    .map_err(|e| InvokeError::from(e.to_string()))?;

                                SetupManager::get_instance()
                                    .resume_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
                                    .await;

                                return Err(InvokeError::from(e.to_string()));
                            }
                        };

                        info!(target: LOG_TARGET_APP_LOGIC, "[ set_custom_node_directory ] restarting phases");
                        SetupManager::get_instance()
                            .resume_phases(vec![SetupPhase::Wallet, SetupPhase::Node])
                            .await;
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "Could not update node data location: {e}");
                    return Err(InvokeError::from(e.to_string()));
                }
            }
        }
        Err(e) => {
            error!(target: LOG_TARGET_APP_LOGIC, "New node directory does not exist: {e}");
            return Err(InvokeError::from(e.to_string()));
        }
    }
    Ok(())
}
