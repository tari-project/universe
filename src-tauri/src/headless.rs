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
//!
//! # State replay
//!
//! Backend events are fire-once: config loads and module-status changes are
//! emitted while setup runs, before any WebSocket client has connected. So
//! that late-joining clients (fresh Playwright browser contexts, reconnects)
//! see correct state, every replayable `backend_state_update` event that
//! flows through the forwarder is cached — the *last real payload* per event
//! type. The cache is replayed:
//!
//! - when a WebSocket client connects (covers reconnects, where frontend
//!   listeners are already registered), and
//! - when the frontend invokes `frontend_ready` (covers fresh page loads,
//!   deterministically after the frontend has registered its listeners).
//!
//! Replayed events are real state, never synthesized — if a module failed,
//! clients see `Failed`, not a hardcoded `Initialized`.

#![cfg(feature = "test-mode")]

use log::{error, info};
use std::collections::HashMap;
use std::sync::{Arc, LazyLock};
use tauri::AppHandle;
use tauri::Listener;
use tauri::Manager;
use tokio::sync::RwLock;

use crate::LOG_TARGET_APP_LOGIC;
use crate::events_emitter::EventsEmitter;
use crate::file_credential_store;
use crate::setup::setup_manager::SetupManager;
use crate::utils;

/// Last real payload seen for each replayable event, keyed by event type
/// (plus a discriminator for per-module / per-phase events).
static REPLAY_CACHE: LazyLock<RwLock<HashMap<String, serde_json::Value>>> =
    LazyLock::new(|| RwLock::new(HashMap::new()));

/// Returns the cache key for a `backend_state_update` event, or `None` if
/// the event is transient (dialog triggers, one-shot prompts) and must not
/// be replayed to late-joining clients.
fn replay_cache_key(event: &serde_json::Value) -> Option<String> {
    let event_type = event.get("event_type")?.as_str()?;
    let key = match event_type {
        // Keyed per module — one entry each for CpuMining / GpuMining / Wallet.
        "UpdateAppModuleStatus" => {
            let module = event.pointer("/payload/module")?.as_str()?;
            format!("{event_type}:{module}")
        }
        // Keyed per setup phase.
        "SetupProgressUpdate" => {
            let phase = event.pointer("/payload/setup_phase")?.as_str()?;
            format!("{event_type}:{phase}")
        }
        // Singleton state events — last one wins.
        "ConfigCoreLoaded"
        | "ConfigUILoaded"
        | "ConfigWalletLoaded"
        | "ConfigMiningLoaded"
        | "ConfigPoolsLoaded"
        | "ConfigMcpLoaded"
        | "SelectedTariAddressChanged"
        | "WalletBalanceUpdate"
        | "WalletStatusUpdate"
        | "WalletUIModeChanged"
        | "BaseNodeUpdate"
        | "NodeTypeUpdate"
        | "CpuMiningUpdate"
        | "GpuMiningUpdate"
        | "UpdateCpuMinerControlsState"
        | "UpdateGpuMinerControlsState"
        | "GpuDevicesUpdate"
        | "DetectedDevices"
        | "NewBlockHeight"
        | "NetworkStatus"
        | "ConnectionStatus"
        | "ExchangeIdChanged"
        | "DisabledPhases"
        | "StuckOnOrphanChain"
        | "AvailableMiners"
        | "UpdateSelectedMiner"
        | "CpuPoolsStatsUpdate"
        | "GpuPoolsStatsUpdate"
        | "InitWalletScanningProgress"
        | "CloseSplashscreen" => event_type.to_string(),
        // Everything else (ShowReleaseNotes, AskForRestart, PIN dialogs,
        // shutdown prompts, ...) is intentionally not replayed.
        _ => return None,
    };
    Some(key)
}

/// Replay priority: configs first so stores are populated before dependent
/// state (module status, balances) lands. Within a group the order is the
/// sorted cache key, which keeps replay deterministic run-to-run.
fn replay_priority(key: &str) -> u8 {
    if key.starts_with("Config") {
        0
    } else if key.starts_with("UpdateAppModuleStatus") {
        2
    } else if key.starts_with("CloseSplashscreen") {
        3
    } else {
        1
    }
}

/// Broadcast the cached state snapshot to all connected WebSocket clients.
/// Safe to call at any time; a no-op when remote-ui isn't running.
pub async fn replay_state_snapshot(app_handle: &AppHandle) {
    let Some(remote_ui_state) = app_handle.try_state::<Arc<RwLock<tauri_remote_ui::RemoteUi>>>()
    else {
        return;
    };
    let mut entries: Vec<(String, serde_json::Value)> = REPLAY_CACHE
        .read()
        .await
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    entries.sort_by(|a, b| {
        replay_priority(&a.0)
            .cmp(&replay_priority(&b.0))
            .then_with(|| a.0.cmp(&b.0))
    });
    let count = entries.len();
    let remote_ui = remote_ui_state.read().await;
    for (_key, event) in entries {
        if let Err(e) = remote_ui.emit("backend_state_update", event) {
            error!(target: LOG_TARGET_APP_LOGIC, "Headless: failed to replay event: {e:?}");
        }
    }
    info!(target: LOG_TARGET_APP_LOGIC, "Headless: replayed {count} cached state events");
}

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
        return;
    }
    info!(target: LOG_TARGET_APP_LOGIC, "Remote UI available at http://localhost:9515");

    // Forward every backend event over the WebSocket and record replayable
    // ones in the cache so they can be re-sent to late-joining clients.
    let forward_handle = handle.clone();
    handle.listen("backend_state_update", move |event| {
        let fwd = forward_handle.clone();
        let payload_str = event.payload().to_string();
        tauri::async_runtime::spawn(async move {
            let Ok(value) = serde_json::from_str::<serde_json::Value>(&payload_str) else {
                return;
            };
            if let Some(key) = replay_cache_key(&value) {
                REPLAY_CACHE.write().await.insert(key, value.clone());
            }
            let remote_ui_state = fwd.state::<Arc<RwLock<tauri_remote_ui::RemoteUi>>>();
            let remote_ui = remote_ui_state.read().await;
            remote_ui.emit("backend_state_update", value).ok();
        });
    });

    // When a WebSocket client connects, replay the current state snapshot.
    // This covers reconnects (listeners already registered on the page).
    // Fresh page loads are additionally covered by the frontend_ready hook,
    // which fires after the frontend has registered its event listeners.
    let connect_handle = handle.clone();
    handle.listen(tauri_remote_ui::CLIENT_CONNECTED_EVENT, move |_event| {
        let handle = connect_handle.clone();
        tauri::async_runtime::spawn(async move {
            replay_state_snapshot(&handle).await;
        });
    });
}
