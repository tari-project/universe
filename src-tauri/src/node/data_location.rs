// Copyright 2026. The Tari Project
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
use std::path::PathBuf;
use tari_common::configuration::Network;
use tauri::ipc::InvokeError;

/// Check if the given path is on a network-mounted filesystem (SMB, NFS, etc.)
/// On macOS, this checks if the path is under /Volumes and is a mounted filesystem
#[cfg(target_os = "macos")]
fn is_network_mount(path: &PathBuf) -> bool {
    // Check if path is under /Volumes (common mount point on macOS)
    let is_volumes = path.starts_with("/Volumes");

    // Try to detect if it's a network filesystem by checking mount info
    if is_volumes {
        // Use mount command to check filesystem type
        if let Ok(output) = std::process::Command::new("mount").args(["-v"]).output() {
            let mount_output = String::from_utf8_lossy(&output.stdout);
            let path_str = path.to_string_lossy();

            for line in mount_output.lines() {
                // Check if this mount line contains our path
                if line.contains(path_str.as_ref())
                    || path_str.starts_with(line.split_whitespace().nth(2).unwrap_or(""))
                {
                    // Check for SMB or NFS filesystems
                    if line.contains("smbfs") || line.contains("nfs") || line.contains("afpfs") {
                        return true;
                    }
                }
            }
        }
    }

    false
}

#[cfg(not(target_os = "macos"))]
fn is_network_mount(_path: &PathBuf) -> bool {
    false
}

/// Safely canonicalize a path, with fallback for network mounts
/// Network mounts (SMB, NFS) may fail canonicalization due to symlink resolution issues
fn safe_canonicalize(path: String) -> Result<PathBuf, String> {
    // First try standard canonicalize
    match canonicalize(&path) {
        Ok(canonical) => Ok(canonical),
        Err(e) => {
            // If canonicalize fails, check if path exists and is accessible
            let path_buf = PathBuf::from(&path);

            if !path_buf.exists() {
                return Err(format!("Path does not exist: {e}"));
            }

            // Check if it's a network mount
            if is_network_mount(&path_buf) {
                warn!(target: LOG_TARGET_APP_LOGIC, "Network mount detected at {path}, using non-canonicalized path");
                // For network mounts, return the path as-is without canonicalization
                // This avoids issues with SMB/NFS symlink resolution
                Ok(path_buf)
            } else {
                // Not a network mount, return the original error
                Err(format!("Failed to canonicalize path: {e}"))
            }
        }
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
    match safe_canonicalize(to_path) {
        Ok(new_dir) => match ConfigCore::update_node_data_directory(new_dir.clone()).await {
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
        },
        Err(e) => {
            error!(target: LOG_TARGET_APP_LOGIC, "New node directory does not exist: {e}");
            return Err(InvokeError::from(e.to_string()));
        }
    }
    Ok(())
}
