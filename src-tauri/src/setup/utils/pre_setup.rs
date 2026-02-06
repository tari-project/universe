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
                        let existing_db = app_handle
                            .path()
                            .app_local_data_dir()
                            .map_err(|e| anyhow::Error::msg(e.to_string()))?
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
        .expect("Could not get config dir");
    // The start of needed restart operations. Break this out into a module if we need n+1
    let tcp_tor_toggled_file = config_path.join("tcp_tor_toggled");
    if tcp_tor_toggled_file.exists() {
        let network = Network::default().as_key_str();

        let local_data_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Could not get local data dir");

        let node_peer_db = local_data_dir.join("node").join(network).join("peer_db");
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
