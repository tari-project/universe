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
