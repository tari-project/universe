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

//! Headless mode support for test-mode builds.
//! Starts the backend with remote-ui WebSocket and file-backed credentials.

#![cfg(feature = "test-mode")]

use log::{error, info};
use std::sync::Arc;
use tauri::AppHandle;
use tauri::Listener;
use tauri::Manager;
use tokio::sync::RwLock;

use std::collections::HashMap;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_core::ConfigCore;
use crate::configs::config_mcp::ConfigMcp;
use crate::configs::config_mining::ConfigMining;
use crate::configs::config_pools::ConfigPools;
use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::ConfigWallet;
use crate::configs::trait_config::ConfigImpl;
use crate::events::UpdateAppModuleStatusPayload;
use crate::events_emitter::EventsEmitter;
use crate::file_credential_store;
use crate::internal_wallet::InternalWallet;
use crate::setup::listeners::{AppModule, AppModuleStatus};
use crate::setup::setup_manager::SetupManager;
use crate::utils;

/// Initialize the file-backed credential store for headless mode.
pub fn init_credential_store(app_handle: &AppHandle) {
    let credential_dir = app_handle
        .path()
        .app_config_dir()
        .expect("Could not get app config dir")
        .join("credentials");
    file_credential_store::set_store_dir(credential_dir.clone());
    keyring::set_default_credential_builder(file_credential_store::default_credential_builder());
    info!(target: LOG_TARGET_APP_LOGIC, "Headless: using file-backed credential store at {:?}", credential_dir);
}

/// Start the headless backend: remote-ui WebSocket + setup pipeline.
pub fn start_headless(handle_clone: AppHandle) {
    info!(target: LOG_TARGET_APP_LOGIC, "Headless mode: starting backend with remote-ui");
    tauri::async_runtime::spawn(async move {
        EventsEmitter::load_app_handle(handle_clone.clone()).await;
        start_remote_ui(&handle_clone).await;
        utils::app_flow_utils::FrontendReadyChannel::current().set_ready();
        info!(target: LOG_TARGET_APP_LOGIC, "Headless: frontend ready channel set (after remote-ui)");
        SetupManager::get_instance()
            .start_setup(handle_clone.clone())
            .await;
        SetupManager::spawn_sleep_mode_handler().await;

        // Re-emit initial state for late-connecting WS clients.
        // Config and wallet events fire during setup before any remote-ui
        // WS client is connected. Periodically replay them so late
        // joiners get the full picture.
        tauri::async_runtime::spawn(async {
            // Run indefinitely — new WS clients can connect at any time
            // during the test session and need the initial state.
            let mut i = 0u64;
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;

                // Re-emit all config events
                EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;
                EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;
                EventsEmitter::emit_ui_config_loaded(&ConfigUI::content().await).await;
                EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;
                EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;
                EventsEmitter::emit_wallet_config_loaded(&ConfigWallet::content().await).await;

                // Re-emit module status so late-joining clients unlock mining.
                // Setup phase events are fire-once; without this the frontend
                // Zustand store stays at NotInitialized and the Start Mining
                // button is permanently disabled.
                // Setup has already completed before this loop starts, so all
                // modules are Initialized.
                for module in [AppModule::CpuMining, AppModule::GpuMining, AppModule::Wallet] {
                    EventsEmitter::emit_update_app_module_status(
                        UpdateAppModuleStatusPayload {
                            module,
                            status: AppModuleStatus::Initialized.as_string(),
                            error_messages: HashMap::new(),
                        },
                    )
                    .await;
                }

                // Re-emit wallet address
                if InternalWallet::is_initialized() {
                    let address = InternalWallet::tari_address().await;
                    let address_type = if InternalWallet::is_internal().await {
                        crate::internal_wallet::TariAddressType::Internal
                    } else {
                        crate::internal_wallet::TariAddressType::External
                    };
                    EventsEmitter::emit_selected_tari_address_changed(&address, address_type).await;
                }

                if i == 0 {
                    info!(target: LOG_TARGET_APP_LOGIC,
                        "Headless: re-emitting initial state for WS clients (every 5s)");
                }
                i += 1;
            }
        });
    });
}

async fn start_remote_ui(handle: &AppHandle) {
    use tauri_remote_ui::RemoteUiExt;
    let mut config = tauri_remote_ui::RemoteUiConfig::default()
        .set_port(Some(9515))
        .enable_application_ui();
    if std::env::var("REMOTE_UI_BIND_ALL").as_deref() == Ok("1") {
        info!(target: LOG_TARGET_APP_LOGIC, "REMOTE_UI_BIND_ALL set: binding remote-ui to 0.0.0.0");
        config = config.set_allowed_origin(tauri_remote_ui::OriginType::Any);
    }
    if let Err(e) = handle.start_remote_ui(config).await {
        error!(target: LOG_TARGET_APP_LOGIC, "Failed to start remote UI: {e:?}");
    } else {
        info!(target: LOG_TARGET_APP_LOGIC, "Remote UI available at http://localhost:9515");
        let forward_handle = handle.clone();
        handle.listen("backend_state_update", move |event| {
            let fwd = forward_handle.clone();
            let payload_str = event.payload().to_string();
            tauri::async_runtime::spawn(async move {
                let remote_ui_state = fwd.state::<Arc<RwLock<tauri_remote_ui::RemoteUi>>>();
                let remote_ui = remote_ui_state.read().await;
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&payload_str) {
                    remote_ui.emit("backend_state_update", value).ok();
                }
            });
        });
    }
}
