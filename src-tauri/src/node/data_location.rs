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
use tari_common::configuration::Network;
use tauri::ipc::InvokeError;

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
    match canonicalize(to_path) {
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

                            if !dest_existed && destination_dir.exists()
                                && let Err(cleanup_err) = fs::remove_dir_all(&destination_dir) {
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
