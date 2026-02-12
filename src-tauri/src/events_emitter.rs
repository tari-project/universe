use crate::configs::config_mining::GpuDevicesSettings;
use crate::LOG_TARGET_APP_LOGIC;
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
use crate::configs::config_ui::WalletUIMode;
use crate::events::{
    ConnectionStatusPayload, CriticalProblemPayload, DisabledPhasesPayload,
    InitWalletScanningProgressPayload, UpdateAppModuleStatusPayload, WalletStatusUpdatePayload,
};
use crate::internal_wallet::TariAddressType;
use crate::mining::cpu::CpuMinerStatus;
use crate::mining::gpu::consts::{GpuMiner, GpuMinerStatus, GpuMinerType};
use crate::mining::gpu::miners::GpuCommonInformation;
use crate::mining::pools::PoolStatus;
use crate::mining::MinerControlsState;
#[cfg(target_os = "windows")]
use crate::system_dependencies::UniversalSystemDependency;
use crate::wallet::wallet_types::{TransactionInfo, WalletBalance};
use crate::{
    configs::{
        config_core::ConfigCoreContent, config_mcp::ConfigMcpContent,
        config_mining::ConfigMiningContent, config_ui::ConfigUIContent,
        config_wallet::ConfigWalletContent,
    },
    events::{
        DetectedDevicesPayload, Event, EventType, NetworkStatusPayload, NewBlockHeightPayload,
        NodeTypeUpdatePayload, ProgressTrackerUpdatePayload, ShowReleaseNotesPayload,
        TariAddressUpdatePayload,
    },
    hardware::hardware_status_monitor::PublicDeviceGpuProperties,
    setup::setup_manager::SetupPhase,
    utils::app_flow_utils::FrontendReadyChannel,
    BaseNodeStatus,
};
use log::error;
use std::collections::HashMap;
use std::sync::LazyLock;
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

use crate::configs::config_pools::ConfigPoolsContent;

const BACKEND_STATE_UPDATE: &str = "backend_state_update";

static INSTANCE: LazyLock<EventsEmitter> = LazyLock::new(EventsEmitter::new);
pub(crate) struct EventsEmitter {
    app_handle: RwLock<Option<AppHandle>>,
}

impl EventsEmitter {
    pub fn new() -> Self {
        Self {
            app_handle: RwLock::new(None),
        }
    }

    pub async fn load_app_handle(app_handle: AppHandle) {
        if INSTANCE.app_handle.read().await.is_some() {
            error!(target: LOG_TARGET_APP_LOGIC, "AppHandle is already set. This should only be set once.");
        } else {
            *INSTANCE.app_handle.write().await = Some(app_handle);
        }
    }

    async fn get_app_handle() -> AppHandle {
        INSTANCE
            .app_handle
            .read()
            .await
            .as_ref()
            .expect("Cannot emit events due to missing AppHandle")
            .clone()
    }
    pub async fn emit_progress_tracker_update(payload: ProgressTrackerUpdatePayload) {
        let event = Event {
            event_type: EventType::SetupProgressUpdate,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ProgressTrackerUpdate event: {e:?}");
        }
    }

    pub async fn emit_stuck_on_orphan_chain(is_stuck: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::StuckOnOrphanChain,
            payload: is_stuck,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit StuckOnOrphanChain event: {e:?}");
        }
    }

    pub async fn emit_show_release_notes(payload: ShowReleaseNotesPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ShowReleaseNotes,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShowReleaseNotesPayload event: {e:?}");
        }
    }
    #[cfg(target_os = "windows")]
    pub async fn emit_system_dependencies_loaded(payload: Vec<UniversalSystemDependency>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::SystemDependenciesLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit MissingApplications event: {e:?}");
        }
    }

    pub async fn emit_critical_problem(payload: CriticalProblemPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CriticalProblem,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit CriticalProblem event: {e:?}");
        }
    }

    pub async fn emit_restarting_phases(payload: Vec<SetupPhase>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::RestartingPhases,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit RestartingPhases event: {e:?}");
        }
    }

    pub async fn emit_ask_for_restart() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::AskForRestart,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit AskForRestart event: {e:?}");
        }
    }

    pub async fn emit_detected_devices(devices: Vec<GpuCommonInformation>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::DetectedDevices,
            payload: DetectedDevicesPayload { devices },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit DetectedDevices event: {e:?}");
        }
    }

    pub async fn emit_update_selected_gpu_miner(payload: GpuMinerType) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UpdateSelectedMiner,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateSelectedMiner event: {e:?}");
        }
    }

    pub async fn emit_available_gpu_miners(payload: HashMap<GpuMinerType, GpuMiner>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::AvailableMiners,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit AvailableMiners event: {e:?}");
        }
    }

    pub async fn emit_close_splashscreen() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CloseSplashscreen,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit CloseSplashscreen event: {e:?}");
        }
    }

    pub async fn emit_network_status(
        download_speed: f64,
        upload_speed: f64,
        latency: f64,
        is_too_low: bool,
    ) {
        let event = Event {
            event_type: EventType::NetworkStatus,
            payload: NetworkStatusPayload {
                download_speed,
                upload_speed,
                latency,
                is_too_low,
            },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit NetworkStatus event: {e:?}");
        }
    }

    pub async fn emit_tor_entry_guards(guards: Vec<String>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UpdateTorEntryGuards,
            payload: guards,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateTorEntryGuards event: {e:?}");
        }
    }

    pub async fn emit_core_config_loaded(payload: &ConfigCoreContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigCoreLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit CoreConfigLoaded event: {e:?}");
        }
    }

    pub async fn emit_ui_config_loaded(payload: &ConfigUIContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigUILoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UIConfigLoaded event: {e:?}");
        }
    }

    pub async fn emit_wallet_config_loaded(payload: &ConfigWalletContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;

        let event = Event {
            event_type: EventType::ConfigWalletLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit WalletConfigLoaded event: {e:?}");
        }
    }

    pub async fn emit_mining_config_loaded(payload: &ConfigMiningContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigMiningLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit MiningConfigLoaded event: {e:?}");
        }
    }
    pub async fn emit_pools_config_loaded(payload: &ConfigPoolsContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigPoolsLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit PoolsConfigLoaded event: {e:?}");
        }
    }
    // TODO: Remove allow(dead_code) when Phase 4 (frontend) wires up ConfigMcpLoaded event
    #[allow(dead_code)]
    pub async fn emit_mcp_config_loaded(payload: &ConfigMcpContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigMcpLoaded,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit McpConfigLoaded event: {e:?}");
        }
    }

    pub async fn emit_wallet_balance_update(balance: WalletBalance) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::WalletBalanceUpdate,
            payload: balance,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit WalletBalanceUpdate event: {e:?}");
        }
    }

    pub async fn emit_base_node_update(status: BaseNodeStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::BaseNodeUpdate,
            payload: status,
        };

        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit BaseNodeUpdate event: {e:?}");
        }
    }

    #[allow(dead_code)]
    pub async fn emit_gpu_devices_update(gpu_public_devices: Vec<PublicDeviceGpuProperties>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::GpuDevicesUpdate,
            payload: gpu_public_devices,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit GpuDevicesUpdate event: {e:?}");
        }
    }

    pub async fn emit_cpu_pools_status_update(pool_status: HashMap<String, PoolStatus>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CpuPoolsStatsUpdate,
            payload: pool_status,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit PoolStatusUpdate event: {e:?}");
        }
    }

    pub async fn emit_gpu_pools_status_update(pool_status: HashMap<String, PoolStatus>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::GpuPoolsStatsUpdate,
            payload: pool_status,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit GpuPoolStatusUpdate event: {e:?}");
        }
    }

    pub async fn emit_cpu_mining_update(status: CpuMinerStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit CpuMiningUpdate event: {e:?}");
        }
    }

    pub async fn emit_gpu_mining_update(status: GpuMinerStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::GpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit GpuMiningUpdate event: {e:?}");
        }
    }

    pub async fn emit_new_block_mined(
        block_height: u64,
        coinbase_transaction: Option<TransactionInfo>,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::NewBlockHeight,
            payload: NewBlockHeightPayload {
                block_height,
                coinbase_transaction,
            },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit NewBlockHeight event: {e:?}");
        }
    }

    pub async fn emit_update_app_module_status(payload: UpdateAppModuleStatusPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UpdateAppModuleStatus,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateAppModuleStatus event: {e:?}");
        }
    }

    pub async fn emit_node_type_update(payload: NodeTypeUpdatePayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::NodeTypeUpdate,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit NodeTypeUpdate event: {e:?}");
        }
    }

    pub async fn emit_background_node_sync_update(payload: HashMap<String, String>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::BackgroundNodeSyncUpdate,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit BackgroundNodeSyncUpdate event: {e:?}");
        }
    }

    pub async fn emit_init_wallet_scanning_progress(
        scanned_height: u64,
        total_height: u64,
        progress: f64,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::InitWalletScanningProgress,
            payload: InitWalletScanningProgressPayload {
                scanned_height,
                total_height,
                progress,
            },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit InitWalletScanningProgress event: {e:?}");
        }
    }

    pub async fn emit_connection_status_changed(connection_status: ConnectionStatusPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConnectionStatus,
            payload: connection_status,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ConnectionStatus event: {e:?}");
        }
    }

    pub async fn emit_exchange_id_changed(exchange_id: String) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ExchangeIdChanged,
            payload: exchange_id,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ExchangeIdChanged event: {e:?}");
        }
    }

    pub async fn emit_selected_tari_address_changed(
        tari_address: &TariAddress,
        tari_address_type: TariAddressType,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::SelectedTariAddressChanged,
            payload: TariAddressUpdatePayload {
                tari_address_type,
                tari_address_base58: tari_address.to_base58(),
                tari_address_emoji: tari_address.to_emoji_string(),
            },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit SelectedTariAddressChanged event: {e:?}");
        }
    }

    pub async fn emit_wallet_ui_mode_changed(payload: WalletUIMode) {
        let _unused: Result<(), tokio::sync::watch::error::RecvError> =
            FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::WalletUIModeChanged,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit WalletUIModeChanged event: {e:?}");
        }
    }

    pub async fn emit_disabled_phases(disabled_phases: Vec<SetupPhase>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::DisabledPhases,
            payload: DisabledPhasesPayload { disabled_phases },
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit DisabledPhasesChanged event: {e:?}");
        }
    }
    pub async fn emit_should_show_exchange_miner_modal() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ShouldShowExchangeMinerModal,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShouldShowExchangeMinerModal event: {e:?}");
        }
    }

    #[cfg(target_os = "macos")]
    pub async fn emit_show_keyring_dialog() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ShowKeyringDialog,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShowKeyringDialog event: {e:?}");
        }
    }

    pub async fn emit_set_pin() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CreatePin,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit CreatePin event: {e:?}");
        }
    }

    pub async fn emit_ask_for_pin() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::EnterPin,
            payload: (),
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit EnterPin event: {e:?}");
        }
    }
    pub async fn emit_update_gpu_devices_settings(payload: GpuDevicesSettings) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UpdateGpuDevicesSettings,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateDevicesSettings event: {e:?}");
        }
    }

    pub async fn emit_pin_locked(payload: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::PinLocked,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit PinLocked event: {e:?}");
        }
    }

    pub async fn emit_seed_backed_up(payload: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::SeedBackedUp,
            payload,
        };
        if let Err(e) = Self::get_app_handle()
            .await
            .emit(BACKEND_STATE_UPDATE, event)
        {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit SeedBackedUp event: {e:?}");
        }
    }

    pub async fn emit_wallet_status_updated(loading: bool, unhealthy: Option<bool>) {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        let evt = Event {
            event_type: EventType::WalletStatusUpdate,
            payload: WalletStatusUpdatePayload { loading, unhealthy },
        };
        if let Err(e) = Self::get_app_handle().await.emit(BACKEND_STATE_UPDATE, evt) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit WalletStatusUpdate event: {e:?}");
        }
    }

    pub async fn emit_update_cpu_miner_state(state: MinerControlsState) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::UpdateCpuMinerControlsState,
                payload: state,
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateCpuMinerState event: {e:?}");
        }
    }

    pub async fn emit_update_gpu_miner_state(state: MinerControlsState) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::UpdateGpuMinerControlsState,
                payload: state,
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit UpdateGpuMinerState event: {e:?}");
        }
    }

    pub async fn emit_open_settings() {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::OpenSettings,
                payload: (),
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit OpenSettings event: {e:?}");
        }
    }

    pub async fn emit_show_eco_alert() {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::ShowEcoAlert,
                payload: (),
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShowEcoAlert event: {e:?}");
        }
    }

    pub async fn emit_feedback_requested() {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::FeedbackSurveyRequested,
                payload: (),
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit FeedbackRequested event: {e:?}");
        }
    }
    pub async fn emit_shutdown_mode_selection_requested() {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::ShutdownModeSelectionRequested,
                payload: (),
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShutdownModeSelectionRequested event: {e:?}");
        }
    }

    pub async fn emit_shutting_down() {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::ShuttingDown,
                payload: (),
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShuttingDown event: {e:?}");
        }
    }

    pub async fn emit_set_show_battery_alert(payload: bool) {
        let _ = FrontendReadyChannel::current().wait_for_ready().await;
        if let Err(e) = Self::get_app_handle().await.emit(
            BACKEND_STATE_UPDATE,
            Event {
                event_type: EventType::SetShowBatteryAlert,
                payload,
            },
        ) {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to emit ShowBatteryAlert event: {e:?}");
        }
    }
}
