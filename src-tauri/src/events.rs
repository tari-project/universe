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

use serde::Serialize;
use std::collections::HashMap;

use crate::{
    gpu_status_file::GpuDevice,
    wallet_adapter::{TransactionInfo, WalletBalance},
};

#[derive(Clone, Debug, Serialize)]
pub enum EventType {
    WalletAddressUpdate,
    WalletBalanceUpdate,
    BaseNodeUpdate,
    GpuDevicesUpdate,
    CpuMiningUpdate,
    GpuMiningUpdate,
    ConnectedPeersUpdate,
    NewBlockHeight,
    AppConfigLoaded,
    CloseSplashscreen,
    DetectedDevices,
    DetectedAvailableGpuEngines,
    ResumingAllProcesses,
    ShowReleaseNotes,
    #[cfg(target_os = "macos")]
    CriticalProblem,
    #[cfg(target_os = "windows")]
    MissingApplications,
    StuckOnOrphanChain,
    NetworkStatus,
    CorePhaseFinished,
    WalletPhaseFinished,
    HardwarePhaseFinished,
    RemoteNodePhaseFinished,
    LocalNodePhaseFinished,
    UnknownPhaseFinished,
    UnlockApp,
    UnlockWallet,
    UnlockMining,
}

#[derive(Clone, Debug, Serialize)]
pub enum ProgressEvents {
    Core,
    #[allow(dead_code)]
    Wallet,
    #[allow(dead_code)]
    Hardware,
    #[allow(dead_code)]
    RemoteNode,
    LocalNode,
    #[allow(dead_code)]
    Unknown,
}
#[derive(Clone, Debug, Serialize)]
pub struct ProgressTrackerUpdatePayload {
    pub phase_title: String,
    pub title: String,
    pub progress: f64,
    pub title_params: Option<HashMap<String, String>>,
}

#[derive(Clone, Debug, Serialize)]
pub struct NetworkStatusPayload {
    pub download_speed: f64,
    pub upload_speed: f64,
    pub latency: f64,
    pub is_too_low: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct ResumingAllProcessesPayload {
    pub title: String,
    pub stage_progress: u32,
    pub stage_total: u32,
    pub is_resuming: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DetectedAvailableGpuEnginesPayload {
    pub engines: Vec<String>,
    pub selected_engine: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct DetectedDevicesPayload {
    pub devices: Vec<GpuDevice>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Event<T, E> {
    pub event_type: E,
    pub payload: T,
}

#[derive(Clone, Debug, Serialize)]
pub struct WalletAddressUpdatePayload {
    pub tari_address_base58: String,
    pub tari_address_emoji: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct NewBlockHeightPayload {
    pub block_height: u64,
    pub coinbase_transaction: Option<TransactionInfo>,
    pub balance: WalletBalance,
}

#[derive(Debug, Serialize, Clone)]
pub struct ShowReleaseNotesPayload {
    pub release_notes: String,
    pub is_app_update_available: bool,
    pub should_show_dialog: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct CriticalProblemPayload {
    pub title: Option<String>,
    pub description: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct NetworkStatus {
    pub download_speed: f64,
    pub upload_speed: f64,
    pub latency: f64,
    pub is_too_low: bool,
}
