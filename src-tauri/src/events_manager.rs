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

use std::collections::HashMap;

use log::{error, info};
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::{AppHandle, Manager};
use tokio::{select, sync::watch::Receiver};

#[cfg(target_os = "macos")]
use crate::events::CriticalProblemPayload;
#[cfg(target_os = "windows")]
use crate::external_dependencies::RequiredExternalDependency;

use crate::{
    commands::CpuMinerStatus,
    configs::{
        config_core::ConfigCore,
        config_mining::ConfigMining,
        config_ui::{ConfigUI, ConfigUIContent},
        config_wallet::ConfigWallet,
        trait_config::ConfigImpl,
    },
    events::{NodeTypeUpdatePayload, ProgressEvents, ShowReleaseNotesPayload},
    events_emitter::EventsEmitter,
    events_service::EventsService,
    gpu_status_file::GpuDevice,
    hardware::hardware_status_monitor::GpuDeviceProperties,
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    wallet_adapter::WalletState,
    BaseNodeStatus, GpuMinerStatus, UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager {
    events_service: EventsService,
}

impl EventsManager {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            events_service: EventsService::new(wallet_state_watch_rx),
        }
    }

    pub async fn handle_internal_wallet_loaded_or_created(&self, app: &AppHandle) {
        let wallet_address = app
            .state::<UniverseAppState>()
            .tari_address
            .read()
            .await
            .clone();
        EventsEmitter::emit_wallet_address_update(app, wallet_address).await;
    }

    pub async fn wait_for_initial_wallet_scan(&self, app: &AppHandle, block_height: u64) {
        let events_service = self.events_service.clone();
        let app = app.clone();
        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

            select! {
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET, "Shutdown signal received. Exiting wait for initial wallet scan");
                }
                result = events_service.wait_for_wallet_scan(block_height, 1200) => {
                    match result {
                        Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                            Some(balance) => EventsEmitter::emit_wallet_balance_update(&app, balance).await,
                            None => {
                                error!(target: LOG_TARGET, "Wallet Balance is None after initial scanning");
                            }
                        },
                        Err(e) => {
                            error!(target: LOG_TARGET, "Error waiting for wallet scan: {:?}", e);
                        }
                    };
                }
            };
        });
    }

    pub async fn handle_new_block_height(&self, app: &AppHandle, block_height: u64) {
        let app_clone = app.clone();
        let events_service = self.events_service.clone();
        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            match events_service.wait_for_wallet_scan(block_height, 20).await {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        let coinbase_tx =
                            if balance.pending_incoming_balance.gt(&MicroMinotari::zero()) {
                                events_service
                                    .get_coinbase_transaction_for_last_mined_block(
                                        &app_clone.state::<UniverseAppState>().wallet_manager,
                                        block_height,
                                    )
                                    .await
                            } else {
                                None
                            };
                        EventsEmitter::emit_new_block_mined(
                            &app_clone,
                            block_height,
                            coinbase_tx,
                            balance,
                        )
                        .await;
                    }
                    None => {
                        error!(target: LOG_TARGET, "Wallet balance is None after new block height #{}", block_height);
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Error waiting for wallet scan: {:?}", e);
                }
            };
        });
    }

    pub async fn handle_base_node_update(&self, app: &AppHandle, status: BaseNodeStatus) {
        EventsEmitter::emit_base_node_update(app, status).await;
    }

    pub async fn handle_connected_peers_update(
        &self,
        app: &AppHandle,
        connected_peers: Vec<String>,
    ) {
        EventsEmitter::emit_connected_peers_update(app, connected_peers).await;
    }

    #[allow(dead_code)]
    pub async fn handle_gpu_devices_update(
        &self,
        app: &AppHandle,
        gpu_devices: Vec<GpuDeviceProperties>,
    ) {
        let gpu_public_devices = gpu_devices
            .iter()
            .map(|gpu_device| gpu_device.public_properties.clone())
            .collect();

        EventsEmitter::emit_gpu_devices_update(app, gpu_public_devices).await;
    }

    pub async fn handle_cpu_mining_update(&self, app: &AppHandle, status: CpuMinerStatus) {
        EventsEmitter::emit_cpu_mining_update(app, status).await;
    }

    pub async fn handle_gpu_mining_update(&self, app: &AppHandle, status: GpuMinerStatus) {
        EventsEmitter::emit_gpu_mining_update(app, status).await;
    }

    pub async fn handle_close_splash_screen(&self, app: &AppHandle) {
        EventsEmitter::emit_close_splashscreen(app).await;
    }

    pub async fn handle_detected_devices(&self, app: &AppHandle, devices: Vec<GpuDevice>) {
        EventsEmitter::emit_detected_devices(app, devices).await;
    }

    pub async fn handle_detected_available_gpu_engines(
        &self,
        app: &AppHandle,
        engines: Vec<String>,
        selected_engine: String,
    ) {
        EventsEmitter::emit_detected_available_gpu_engines(app, engines, selected_engine).await;
    }

    #[allow(dead_code)]
    pub async fn handle_restarting_phases(&self, app: &AppHandle, payload: Vec<SetupPhase>) {
        EventsEmitter::emit_restarting_phases(app, payload).await;
    }
    pub async fn handle_network_status_update(
        &self,
        app: &AppHandle,
        download_speed: f64,
        upload_speed: f64,
        latency: f64,
        is_too_low: bool,
    ) {
        EventsEmitter::emit_network_status(app, download_speed, upload_speed, latency, is_too_low)
            .await;
    }

    #[cfg(target_os = "macos")]
    pub async fn handle_critical_problem(
        &self,
        app: &AppHandle,
        title: Option<String>,
        description: Option<String>,
    ) {
        EventsEmitter::emit_critical_problem(app, CriticalProblemPayload { title, description })
            .await;
    }

    #[cfg(target_os = "windows")]
    pub async fn handle_missing_application_files(
        &self,
        app: &AppHandle,
        external_dependecies: RequiredExternalDependency,
    ) {
        EventsEmitter::emit_missing_applications(app, external_dependecies).await;
    }

    pub async fn handle_show_release_notes(
        &self,
        app: &AppHandle,
        payload: ShowReleaseNotesPayload,
    ) {
        EventsEmitter::emit_show_release_notes(app, payload).await;
    }

    pub async fn handle_stuck_on_orphan_chain(&self, app: &AppHandle, is_stuck: bool) {
        EventsEmitter::emit_stuck_on_orphan_chain(app, is_stuck).await;
    }
    pub async fn handle_progress_tracker_update(
        &self,
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

    pub async fn handle_core_phase_finished(&self, app: &AppHandle, status: bool) {
        EventsEmitter::emit_core_phase_finished(app, status).await;
    }

    pub async fn handle_wallet_phase_finished(&self, app: &AppHandle, status: bool) {
        EventsEmitter::emit_wallet_phase_finished(app, status).await;
    }

    pub async fn handle_hardware_phase_finished(&self, app: &AppHandle, status: bool) {
        EventsEmitter::emit_hardware_phase_finished(app, status).await;
    }

    pub async fn handle_node_phase_finished(&self, app: &AppHandle, status: bool) {
        EventsEmitter::emit_node_phase_finished(app, status).await;
    }
    pub async fn handle_unknown_phase_finished(&self, app: &AppHandle, status: bool) {
        EventsEmitter::emit_unknown_phase_finished(app, status).await;
    }
    pub async fn handle_unlock_app(&self, app: &AppHandle) {
        EventsEmitter::emit_unlock_app(app).await;
    }

    pub async fn handle_unlock_wallet(&self, app: &AppHandle) {
        EventsEmitter::emit_unlock_wallet(app).await;
    }

    pub async fn handle_unlock_mining(&self, app: &AppHandle) {
        EventsEmitter::emit_unlock_mining(app).await;
    }
    pub async fn handle_lock_wallet(&self, app: &AppHandle) {
        EventsEmitter::emit_lock_wallet(app).await;
    }

    pub async fn handle_lock_mining(&self, app: &AppHandle) {
        EventsEmitter::emit_lock_mining(app).await;
    }

    pub async fn handle_node_type_update(&self, app: &AppHandle) {
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

    pub async fn handle_config_core_loaded(&self, app: &AppHandle) {
        let payload = ConfigCore::content().await;
        EventsEmitter::emit_core_config_loaded(app, payload).await;
    }

    pub async fn handle_config_ui_loaded(&self, app: &AppHandle) {
        let payload = ConfigUI::content().await;
        EventsEmitter::emit_ui_config_loaded(app, payload).await;
        let _unused = ConfigUI::update_field(
            ConfigUIContent::propose_system_language,
            "en-US".to_string(),
        )
        .await;
    }

    pub async fn handle_config_mining_loaded(&self, app: &AppHandle) {
        let payload = ConfigMining::content().await;
        EventsEmitter::emit_mining_config_loaded(app, payload).await;
    }

    pub async fn handle_config_wallet_loaded(&self, app: &AppHandle) {
        let payload = ConfigWallet::content().await;
        EventsEmitter::emit_wallet_config_loaded(app, payload).await;
    }

    pub async fn handle_background_node_sync_update(&self, app: &AppHandle, progress_params: HashMap::<String, String>) {
        EventsEmitter::emit_background_node_sync_update(app, progress_params).await;
    }
}
