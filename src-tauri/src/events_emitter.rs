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

use log::{error, info};
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Emitter};

use crate::{
    commands::CpuMinerStatus,
    events::{
        DetectedAvailableGpuEnginesPayload, DetectedDevicesPayload, Event, EventType,
        NetworkStatusPayload, NewBlockHeightPayload, ResumingAllProcessesPayload,
        SetupStatusPayload, WalletAddressUpdatePayload,
    },
    gpu_status_file::GpuDevice,
    hardware::hardware_status_monitor::PublicDeviceProperties,
    utils::app_flow_utils::FrontendReadyChannel,
    wallet_adapter::{TransactionInfo, WalletBalance},
    AppConfig, BaseNodeStatus, GpuMinerStatus,
};

const LOG_TARGET: &str = "tari::universe::events_emitter";
const BACKEND_STATE_UPDATE: &str = "backend_state_update";

pub(crate) struct EventsEmitter;

impl EventsEmitter {
    pub async fn emit_setup_status(app_handle: &AppHandle, payload: SetupStatusPayload) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::SetupStatus,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit SetupStatus event: {:?}", e);
        }
    }

    pub async fn emit_resuming_all_processes(
        app_handle: &AppHandle,
        payload: ResumingAllProcessesPayload,
    ) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::ResumingAllProcesses,
            payload,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit ResumingAllProcesses event: {:?}", e);
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
    pub async fn emit_app_config_loaded(app_handle: &AppHandle, app_config: AppConfig) {
        let _unused = FrontendReadyChannel::current().wait_for_ready().await;
        let event = Event {
            event_type: EventType::AppConfigLoaded,
            payload: app_config,
        };
        if let Err(e) = app_handle.emit(BACKEND_STATE_UPDATE, event) {
            error!(target: LOG_TARGET, "Failed to emit AppConfigLoaded event: {:?}", e);
        }
        info!(target: LOG_TARGET, "AppConfigLoaded event emitted");
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
}
