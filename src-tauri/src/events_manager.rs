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

use std::{collections::HashMap, time::Duration};

use log::error;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::{AppHandle, Manager};

use crate::configs::config_mining::ConfigMiningContent;
use crate::configs::config_wallet::ConfigWalletContent;
#[cfg(target_os = "windows")]
use crate::external_dependencies::RequiredExternalDependency;
use crate::{configs::config_core::ConfigCoreContent, events::CriticalProblemPayload};

use crate::{
    commands::CpuMinerStatus,
    configs::config_ui::ConfigUIContent,
    events::{NodeTypeUpdatePayload, ProgressEvents, ShowReleaseNotesPayload},
    events_emitter::EventsEmitter,
    gpu_status_file::GpuDevice,
    hardware::hardware_status_monitor::GpuDeviceProperties,
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    BaseNodeStatus, GpuMinerStatus, UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager;

impl EventsManager {
    pub async fn handle_internal_wallet_loaded_or_created(app: &AppHandle) {
        let wallet_address = app
            .state::<UniverseAppState>()
            .tari_address
            .read()
            .await
            .clone();
        EventsEmitter::emit_wallet_address_update(app, wallet_address).await;
    }

    pub async fn handle_new_block_height(app: &AppHandle, block_height: u64) {
        let app_clone = app.clone();
        let wallet_manager = app.state::<UniverseAppState>().wallet_manager.clone();

        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            // Use a short timeout for processing new blocks
            match wallet_manager.wait_for_scan_to_height(block_height, Duration::from_secs(5)).await {
                Ok(scanned_wallet_state) => {
                    if let Some(balance) = scanned_wallet_state.balance {
                        // Check for coinbase transaction if there's pending balance
                        let coinbase_tx = if balance.pending_incoming_balance.gt(&MicroMinotari::zero()) {
                            match wallet_manager.find_coinbase_transaction_for_block(block_height).await {
                                Ok(tx) => tx,
                                Err(e) => {
                                    error!(target: LOG_TARGET, "Failed to get coinbase transaction: {:?}", e);
                                    None
                                }
                            }
                        } else {
                            None
                        };

                        EventsEmitter::emit_new_block_mined(
                            &app_clone,
                            block_height,
                            coinbase_tx,
                            Some(balance),
                        )
                        .await;
                    } else {
                        error!(target: LOG_TARGET, "Wallet balance is None after new block height #{}", block_height);
                        EventsEmitter::emit_new_block_mined(
                            &app_clone,
                            block_height,
                            None,
                            None,
                        )
                        .await;
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Error waiting for wallet scan: {}", e);
                    EventsEmitter::emit_new_block_mined(
                        &app_clone,
                        block_height,
                        None,
                        None,
                    )
                    .await;
                }
            }
        });
    }

    pub async fn handle_base_node_update(app: &AppHandle, status: BaseNodeStatus) {
        EventsEmitter::emit_base_node_update(app, status).await;
    }

    pub async fn handle_connected_peers_update(app: &AppHandle, connected_peers: Vec<String>) {
        EventsEmitter::emit_connected_peers_update(app, connected_peers).await;
    }

    #[allow(dead_code)]
    pub async fn handle_gpu_devices_update(app: &AppHandle, gpu_devices: Vec<GpuDeviceProperties>) {
        let gpu_public_devices = gpu_devices
            .iter()
            .map(|gpu_device| gpu_device.public_properties.clone())
            .collect();

        EventsEmitter::emit_gpu_devices_update(app, gpu_public_devices).await;
    }

    pub async fn handle_cpu_mining_update(app: &AppHandle, status: CpuMinerStatus) {
        EventsEmitter::emit_cpu_mining_update(app, status).await;
    }

    pub async fn handle_gpu_mining_update(app: &AppHandle, status: GpuMinerStatus) {
        EventsEmitter::emit_gpu_mining_update(app, status).await;
    }

    pub async fn handle_close_splash_screen(app: &AppHandle) {
        EventsEmitter::emit_close_splashscreen(app).await;
    }

    pub async fn handle_detected_devices(app: &AppHandle, devices: Vec<GpuDevice>) {
        EventsEmitter::emit_detected_devices(app, devices).await;
    }

    pub async fn handle_detected_available_gpu_engines(
        app: &AppHandle,
        engines: Vec<String>,
        selected_engine: String,
    ) {
        EventsEmitter::emit_detected_available_gpu_engines(app, engines, selected_engine).await;
    }

    pub async fn handle_restarting_phases(app: &AppHandle, payload: Vec<SetupPhase>) {
        EventsEmitter::emit_restarting_phases(app, payload).await;
    }

    pub async fn handle_ask_for_restart(app: &AppHandle) {
        EventsEmitter::emit_ask_for_restart(app).await;
    }

    pub async fn handle_network_status_update(
        app: &AppHandle,
        download_speed: f64,
        upload_speed: f64,
        latency: f64,
        is_too_low: bool,
    ) {
        EventsEmitter::emit_network_status(app, download_speed, upload_speed, latency, is_too_low)
            .await;
    }

    pub async fn handle_critical_problem(
        app: &AppHandle,
        title: Option<String>,
        description: Option<String>,
    ) {
        EventsEmitter::emit_critical_problem(app, CriticalProblemPayload { title, description })
            .await;
    }

    #[cfg(target_os = "windows")]
    pub async fn handle_missing_application_files(
        app: &AppHandle,
        external_dependecies: RequiredExternalDependency,
    ) {
        EventsEmitter::emit_missing_applications(app, external_dependecies).await;
    }

    pub async fn handle_show_release_notes(app: &AppHandle, payload: ShowReleaseNotesPayload) {
        EventsEmitter::emit_show_release_notes(app, payload).await;
    }

    pub async fn handle_stuck_on_orphan_chain(app: &AppHandle, is_stuck: bool) {
        EventsEmitter::emit_stuck_on_orphan_chain(app, is_stuck).await;
    }
    pub async fn handle_progress_tracker_update(
        app: &AppHandle,
        event_type: ProgressEvents,
        phase_title: String,
        title: String,
        progress: f64,
        title_params: Option<HashMap<String, String>>,
        is_complete: bool,
    ) {
        EventsEmitter::emit_progress_tracker_update(
            app,
            event_type,
            phase_title,
            title,
            progress,
            title_params,
            is_complete,
        )
        .await;
    }

    pub async fn handle_core_phase_finished(app: &AppHandle, status: bool) {
        EventsEmitter::emit_core_phase_finished(app, status).await;
    }

    pub async fn handle_wallet_phase_finished(app: &AppHandle, status: bool) {
        EventsEmitter::emit_wallet_phase_finished(app, status).await;
    }

    pub async fn handle_hardware_phase_finished(app: &AppHandle, status: bool) {
        EventsEmitter::emit_hardware_phase_finished(app, status).await;
    }

    pub async fn handle_node_phase_finished(app: &AppHandle, status: bool) {
        EventsEmitter::emit_node_phase_finished(app, status).await;
    }
    pub async fn handle_unknown_phase_finished(app: &AppHandle, status: bool) {
        EventsEmitter::emit_unknown_phase_finished(app, status).await;
    }
    pub async fn handle_unlock_app(app: &AppHandle) {
        EventsEmitter::emit_unlock_app(app).await;
    }

    pub async fn handle_unlock_wallet(app: &AppHandle) {
        EventsEmitter::emit_unlock_wallet(app).await;
    }

    pub async fn handle_unlock_mining(app: &AppHandle) {
        EventsEmitter::emit_unlock_mining(app).await;
    }
    pub async fn handle_lock_wallet(app: &AppHandle) {
        EventsEmitter::emit_lock_wallet(app).await;
    }

    pub async fn handle_lock_mining(app: &AppHandle) {
        EventsEmitter::emit_lock_mining(app).await;
    }

    pub async fn handle_node_type_update(app: &AppHandle) {
        let node_manager = &app.state::<UniverseAppState>().node_manager;
        let node_type = node_manager.get_node_type().await.ok();
        let node_identity = node_manager.get_identity().await.ok();
        let node_connection_address = node_manager.get_connection_address().await.ok();
        let payload = NodeTypeUpdatePayload {
            node_type,
            node_identity,
            node_connection_address,
        };

        EventsEmitter::emit_node_type_update(app, payload).await;
    }

    pub async fn handle_config_core_loaded(app: &AppHandle, payload: ConfigCoreContent) {
        EventsEmitter::emit_core_config_loaded(app, payload).await;
    }

    pub async fn handle_config_ui_loaded(app: &AppHandle, payload: ConfigUIContent) {
        EventsEmitter::emit_ui_config_loaded(app, payload).await;
    }

    pub async fn handle_config_mining_loaded(app: &AppHandle, payload: ConfigMiningContent) {
        EventsEmitter::emit_mining_config_loaded(app, payload).await;
    }

    pub async fn handle_config_wallet_loaded(app: &AppHandle, payload: ConfigWalletContent) {
        EventsEmitter::emit_wallet_config_loaded(app, payload).await;
    }

    pub async fn handle_background_node_sync_update(
        app: &AppHandle,
        progress_params: HashMap<String, String>,
    ) {
        EventsEmitter::emit_background_node_sync_update(app, progress_params).await;
    }
}
