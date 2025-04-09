use std::collections::HashMap;

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
#[cfg(target_os = "macos")]
use crate::events::CriticalProblemPayload;
#[cfg(target_os = "windows")]
use crate::external_dependencies::RequiredExternalDependency;
use crate::{
    commands::CpuMinerStatus,
    configs::{
        config_core::ConfigCoreContent, config_mining::ConfigMiningContent,
        config_ui::ConfigUIContent, config_wallet::ConfigWalletContent,
    },
    events::{
        DetectedAvailableGpuEnginesPayload, DetectedDevicesPayload, Event, EventType,
        NetworkStatusPayload, NewBlockHeightPayload, NodeTypeUpdatePayload, ProgressEvents,
        ProgressTrackerUpdatePayload, ShowReleaseNotesPayload, WalletAddressUpdatePayload,
    },
    gpu_status_file::GpuDevice,
    hardware::hardware_status_monitor::PublicDeviceProperties,
    setup::setup_manager::SetupPhase,
    utils::app_flow_utils::FrontendReadyChannel,
    wallet_adapter::{TransactionInfo, WalletBalance},
    BaseNodeStatus, GpuMinerStatus,
};
use log::error;
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Emitter};

const LOG_TARGET: &str = "tari::universe::events_emitter";
const BACKEND_STATE_UPDATE: &str = "backend_state_update";
const PROGRESS_TRACKER_UPDATE: &str = "progress_tracker_update";

pub(crate) struct EventsEmitter;

impl EventsEmitter {
    pub async fn emit_progress_tracker_update(
        app_handle: &AppHandle,
        event_type: ProgressEvents,
        phase_title: String,
        title: String,
        progress: f64,
        title_params: Option<HashMap<String, String>>,
        is_complete: bool,
    ) {
        let event = Event {
            event_type,
            payload: ProgressTrackerUpdatePayload {
                phase_title,
                title,
                progress,
                title_params,
                is_complete,
            },
        };
        if let Err(e) = app_handle.emit(PROGRESS_TRACKER_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit ProgressTrackerUpdate event: {:?}", e);
        }
    }

    pub async fn emit_stuck_on_orphan_chain(app_handle: &AppHandle, is_stuck: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::StuckOnOrphanChain,
            payload: is_stuck,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit StuckOnOrphanChain event: {:?}", e);
        }
    }

    pub async fn emit_show_release_notes(app_handle: &AppHandle, payload: ShowReleaseNotesPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ShowReleaseNotes,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit ShowReleaseNotesPayload event: {:?}", e);
        }
    }

    #[cfg(target_os = "windows")]
    pub async fn emit_missing_applications(
        app_handle: &AppHandle,
        external_dependencies: RequiredExternalDependency,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::MissingApplications,
            payload: external_dependencies,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit MissingApplications event: {:?}", e);
        }
    }

    #[cfg(target_os = "macos")]
    pub async fn emit_critical_problem(app_handle: &AppHandle, payload: CriticalProblemPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CriticalProblem,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit CriticalProblem event: {:?}", e);
        }
    }

    #[allow(dead_code)]
    pub async fn emit_restarting_phases(app_handle: &AppHandle, payload: Vec<SetupPhase>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::RestartingPhases,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit RestartingPhases event: {:?}", e);
        }
    }

    pub async fn emit_detected_devices(app_handle: &AppHandle, devices: Vec<GpuDevice>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::DetectedDevices,
            payload: DetectedDevicesPayload { devices },
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit DetectedDevices event: {:?}", e);
        }
    }

    pub async fn emit_detected_available_gpu_engines(
        app_handle: &AppHandle,
        engines: Vec<String>,
        selected_engine: String,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::DetectedAvailableGpuEngines,
            payload: DetectedAvailableGpuEnginesPayload {
                engines,
                selected_engine,
            },
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit DetectedAvailableGpuEngines event: {:?}", e);
        }
    }

    pub async fn emit_close_splashscreen(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CloseSplashscreen,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit CloseSplashscreen event: {:?}", e);
        }
    }

    pub async fn emit_network_status(
        app_handle: &AppHandle,
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
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit NetworkStatus event: {:?}", e);
        }
    }
    // pub async fn emit_app_config_loaded(app_handle: &AppHandle, app_config: AppConfig) {
    //     let _unused = FrontendReadyChannel::current().wait_for_ready().await;
    //     let event = Event {
    //         event_type: EventType::AppConfigLoaded,
    //         payload: app_config,
    //     };
    //     if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
    //         error!(target: LOG_TARGET, "Failed to emit AppConfigLoaded event: {:?}", e);
    //     }
    //     info!(target: LOG_TARGET, "AppConfigLoaded event emitted");
    // }

    pub async fn emit_core_config_loaded(app_handle: &AppHandle, payload: ConfigCoreContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigCoreLoaded,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit CoreConfigLoaded event: {:?}", e);
        }
    }

    pub async fn emit_ui_config_loaded(app_handle: &AppHandle, payload: ConfigUIContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigUILoaded,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit UIConfigLoaded event: {:?}", e);
        }
    }

    pub async fn emit_wallet_config_loaded(app_handle: &AppHandle, payload: ConfigWalletContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigWalletLoaded,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit WalletConfigLoaded event: {:?}", e);
        }
    }

    pub async fn emit_mining_config_loaded(app_handle: &AppHandle, payload: ConfigMiningContent) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConfigMiningLoaded,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit MiningConfigLoaded event: {:?}", e);
        }
    }

    pub async fn emit_wallet_address_update(app_handle: &AppHandle, wallet_address: TariAddress) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::WalletAddressUpdate,
            payload: WalletAddressUpdatePayload {
                tari_address_base58: wallet_address.to_base58(),
                tari_address_emoji: wallet_address.to_emoji_string(),
            },
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit WalletAddressUpdate event: {:?}", e);
        }
    }

    pub async fn emit_wallet_balance_update(app_handle: &AppHandle, balance: WalletBalance) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::WalletBalanceUpdate,
            payload: balance,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit WalletBalanceUpdate event: {:?}", e);
        }
    }

    pub async fn emit_base_node_update(app_handle: &AppHandle, status: BaseNodeStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::BaseNodeUpdate,
            payload: status,
        };

        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit BaseNodeUpdate event: {:?}", e);
        }
    }

    #[allow(dead_code)]
    pub async fn emit_gpu_devices_update(
        app_handle: &AppHandle,
        gpu_public_devices: Vec<PublicDeviceProperties>,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::GpuDevicesUpdate,
            payload: gpu_public_devices,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit GpuDevicesUpdate event: {:?}", e);
        }
    }

    pub async fn emit_cpu_mining_update(app_handle: &AppHandle, status: CpuMinerStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit CpuMiningUpdate event: {:?}", e);
        }
    }

    pub async fn emit_gpu_mining_update(app_handle: &AppHandle, status: GpuMinerStatus) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::GpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit GpuMiningUpdate event: {:?}", e);
        }
    }

    pub async fn emit_connected_peers_update(app_handle: &AppHandle, connected_peers: Vec<String>) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ConnectedPeersUpdate,
            payload: connected_peers,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit ConnectedPeersUpdate event: {:?}", e);
        }
    }

    pub async fn emit_new_block_mined(
        app_handle: &AppHandle,
        block_height: u64,
        coinbase_transaction: Option<TransactionInfo>,
        balance: WalletBalance,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::NewBlockHeight,
            payload: NewBlockHeightPayload {
                block_height,
                coinbase_transaction,
                balance,
            },
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit NewBlockHeight event: {:?}", e);
        }
    }

    pub async fn emit_core_phase_finished(app_handle: &AppHandle, status: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::CorePhaseFinished,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit CorePhaseFinished event: {:?}", e);
        }
    }

    pub async fn emit_wallet_phase_finished(app_handle: &AppHandle, status: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::WalletPhaseFinished,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit WalletPhaseFinished event: {:?}", e);
        }
    }

    pub async fn emit_hardware_phase_finished(app_handle: &AppHandle, status: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::HardwarePhaseFinished,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit HardwarePhaseFinished event: {:?}", e);
        }
    }

    pub async fn emit_node_phase_finished(app_handle: &AppHandle, status: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::NodePhaseFinished,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit NodePhaseFinished event: {:?}", e);
        }
    }

    pub async fn emit_unknown_phase_finished(app_handle: &AppHandle, status: bool) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UnknownPhaseFinished,
            payload: status,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit UnknownPhaseFinished event: {:?}", e);
        }
    }

    pub async fn emit_unlock_app(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UnlockApp,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit UnlockApp event: {:?}", e);
        }
    }

    pub async fn emit_unlock_wallet(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UnlockWallet,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit UnlockWallet event: {:?}", e);
        }
    }

    pub async fn emit_unlock_mining(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::UnlockMining,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit UnlockMining event: {:?}", e);
        }
    }

    pub async fn emit_lock_wallet(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::LockWallet,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit LockWallet event: {:?}", e);
        }
    }

    pub async fn emit_lock_mining(app_handle: &AppHandle) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::LockMining,
            payload: (),
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit LockMining event: {:?}", e);
        }
    }

    pub async fn emit_node_type_update(app_handle: &AppHandle, payload: NodeTypeUpdatePayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::NodeTypeUpdate,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit NodeTypeUpdate event: {:?}", e);
        }
    }

    pub async fn emit_background_node_sync_update(
        app_handle: &AppHandle,
        payload: HashMap<String, String>,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::BackgroundNodeSyncUpdate,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit BackgroundNodeSyncUpdate event: {:?}", e);
        }
    }
}
