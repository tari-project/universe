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
use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::LOG_TARGET_APP_LOGIC;
use log::{error, info, warn};
use std::fs;
use std::fs::remove_file;
use std::path::Path;
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tauri_plugin_cli::CliExt;

pub async fn check_data_import(app_handle: AppHandle) -> Result<(), anyhow::Error> {
    match app_handle.cli().matches() {
        Ok(matches) => {
            if let Some(backup_path) = matches.args.get("import-backup") {
                if let Some(backup_path) = backup_path.value.as_str() {
                    info!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Trying to copy backup to existing db: {backup_path:?}"
                    );
                    let backup_path = Path::new(backup_path);
                    if backup_path.exists() {
                        let local_data_dir = app_handle
                            .path()
                            .app_local_data_dir()
                            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

                        let mut node_data_dir = local_data_dir.clone();
                        if let Some(custom_path) =
                            ConfigCore::content().await.node_data_directory().clone()
                        {
                            node_data_dir = custom_path;
                        }

                        let existing_db = node_data_dir
                            .join("node")
                            .join(Network::get_current_or_user_setting_or_default().to_string())
                            .join("data")
                            .join("base_node")
                            .join("db");

                        info!(target: LOG_TARGET_APP_LOGIC, "Existing db path: {existing_db:?}");
                        let _unused = fs::remove_dir_all(&existing_db).inspect_err(|e| {
                            warn!(
                                target: LOG_TARGET_APP_LOGIC,
                                "Could not remove existing db when importing backup: {e:?}"
                            )
                        });
                        let _unused = fs::create_dir_all(&existing_db).inspect_err(|e| {
                            error!(
                                target: LOG_TARGET_APP_LOGIC,
                                "Could not create existing db when importing backup: {e:?}"
                            )
                        });
                        let _unused = fs::copy(backup_path, existing_db.join("data.mdb"))
                            .inspect_err(|e| {
                                error!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "Could not copy backup to existing db: {e:?}"
                                )
                            });
                    } else {
                        warn!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Backup file does not exist: {backup_path:?}"
                        );
                    }
                }
            }
        }
        Err(e) => {
            error!(target: LOG_TARGET_APP_LOGIC, "Could not get cli matches: {e:?}");
            return Err(anyhow::Error::from(e));
        }
    };

    Ok(())
}
pub async fn clear_data(app_handle: AppHandle) -> Result<(), anyhow::Error> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| anyhow::Error::msg(e.to_string()))?;

    let tcp_tor_toggled_file = config_path.join("tcp_tor_toggled");
    if tcp_tor_toggled_file.exists() {
        let network = Network::default().as_key_str();

        let local_data_dir = app_handle
            .path()
            .app_local_data_dir()
            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

        let mut node_data_dir = local_data_dir.clone();
        if let Some(custom_path) = ConfigCore::content().await.node_data_directory().clone() {
            node_data_dir = custom_path;
        }

        let node_peer_db = node_data_dir.join("node").join(network).join("peer_db");
        let wallet_peer_db = local_data_dir.join("wallet").join(network).join("peer_db");

        // They may not exist. This could be first run.
        if node_peer_db.exists() {
            if let Err(e) = fs::remove_dir_all(node_peer_db) {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Could not clear peer data folder: {e}"
                );
            }
        }

        if wallet_peer_db.exists() {
            if let Err(e) = fs::remove_dir_all(wallet_peer_db) {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Could not clear peer data folder: {e}"
                );
            }
        }

        remove_file(tcp_tor_toggled_file)?
    }

    Ok(())
}
