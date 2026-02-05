use crate::configs::config_core::ConfigCore;
use crate::setup::setup_manager::{SetupManager, SetupPhase};
use crate::LOG_TARGET_APP_LOGIC;
use fs_extra::{dir, move_items_with_progress, TransitProcess};
use log::{error, info};
use std::fs;
use tauri::ipc::InvokeError;

pub async fn update_data_location(to_path: String) -> Result<(), InvokeError> {
    let options = dir::CopyOptions::new();
    let handle = |process_info: TransitProcess| {
        println!("{}", process_info.total_bytes);
        dir::TransitProcessResult::ContinueOrAbort
    };
    let new_dir;
    if let Ok(path) = fs::canonicalize(to_path) {
        new_dir = path.join("node");

        match ConfigCore::update_node_data_directory(new_dir.clone()).await {
            Ok(previous) => {
                if let Some(previous) = previous {
                    SetupManager::get_instance()
                        .shutdown_phases(vec![SetupPhase::Node])
                        .await;

                    let from_paths = vec![previous.join("node")];

                    move_items_with_progress(&from_paths, &new_dir, &options, &handle)
                        .map_err(|e| InvokeError::from(e.to_string()))?;

                    info!(target: LOG_TARGET_APP_LOGIC, "[ set_custom_node_directory ] restarting phases");

                    SetupManager::get_instance()
                        .resume_phases(vec![SetupPhase::Node])
                        .await;
                }
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Could not update node data location: {e}");
                return Err(InvokeError::from(e.to_string()));
            }
        }
    }

    Ok(())
}
