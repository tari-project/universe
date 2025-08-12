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
use std::{
    collections::HashMap,
    hash::{Hash, Hasher},
};

use crate::{
    gpu_devices::GpuDeviceInformation,
    internal_wallet::TariAddressType,
    node::{node_adapter::NodeIdentity, node_manager::NodeType},
    setup::setup_manager::SetupPhase,
    wallet::wallet_types::{TransactionInfo, WalletBalance},
};

#[derive(Clone, Debug, Serialize)]
pub enum EventType {
    WalletBalanceUpdate,
    BaseNodeUpdate,
    GpuDevicesUpdate,
    CpuPoolStatsUpdate,
    GpuPoolStatsUpdate,
    CpuMiningUpdate,
    GpuMiningUpdate,
    ConnectedPeersUpdate,
    NewBlockHeight,
    CloseSplashscreen,
    DetectedDevices,
    DetectedAvailableGpuEngines,
    RestartingPhases,
    AskForRestart,
    ShowReleaseNotes,
    CriticalProblem,
    #[cfg(target_os = "windows")]
    MissingApplications,
    StuckOnOrphanChain,
    NetworkStatus,
    CorePhaseFinished,
    WalletPhaseFinished,
    HardwarePhaseFinished,
    NodePhaseFinished,
    MiningPhaseFinished,
    InitialSetupFinished,
    UnlockApp,
    UnlockWallet,
    UnlockCpuMining,
    UnlockGpuMining,
    LockWallet,
    LockCpuMining,
    LockGpuMining,
    NodeTypeUpdate,
    ConfigCoreLoaded,
    ConfigUILoaded,
    ConfigWalletLoaded,
    ConfigMiningLoaded,
    ConfigPoolsLoaded,
    BackgroundNodeSyncUpdate,
    InitWalletScanningProgress,
    ConnectionStatus,
    ExchangeIdChanged,
    DisabledPhases,
    ShouldShowExchangeMinerModal,
    SelectedTariAddressChanged,
    WalletUIModeChanged,
    ShowKeyringDialog,
    CreatePin,
    EnterPin,
    UpdateGpuDevicesSettings,
    PinLocked,
    SeedBackedUp,
}

#[derive(Clone, Debug, Serialize)]
pub enum ProgressEvents {
    Core,
    Wallet,
    Hardware,
    Node,
    Mining,
}
#[derive(Clone, Debug, Serialize)]
pub struct ProgressTrackerUpdatePayload {
    pub phase_title: String,
    pub title: String,
    pub progress: f64,
    pub title_params: Option<HashMap<String, String>>,
    pub is_complete: bool,
}

impl Hash for ProgressTrackerUpdatePayload {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.phase_title.hash(state);
        self.title.hash(state);
        self.progress.to_bits().hash(state);
        if let Some(params) = &self.title_params {
            params.hasher();
        }
        self.is_complete.hash(state);
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct NetworkStatusPayload {
    pub download_speed: f64,
    pub upload_speed: f64,
    pub latency: f64,
    pub is_too_low: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DetectedAvailableGpuEnginesPayload {
    pub engines: Vec<String>,
    pub selected_engine: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct DetectedDevicesPayload {
    pub devices: Vec<GpuDeviceInformation>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Event<T, E> {
    pub event_type: E,
    pub payload: T,
}

#[derive(Clone, Debug, Serialize)]
pub struct NewBlockHeightPayload {
    pub block_height: u64,
    pub coinbase_transaction: Option<TransactionInfo>,
    pub balance: Option<WalletBalance>,
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
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct NodeTypeUpdatePayload {
    pub node_type: Option<NodeType>,
    pub node_identity: Option<NodeIdentity>,
    pub node_connection_address: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct InitWalletScanningProgressPayload {
    pub scanned_height: u64,
    pub total_height: u64,
    pub progress: f64,
}

#[derive(Serialize, Clone, Debug)]
pub enum ConnectionStatusPayload {
    InProgress,
    Succeed,
    #[allow(dead_code)]
    Failed,
}

#[derive(Debug, Serialize, Clone)]
pub struct DisabledPhasesPayload {
    pub disabled_phases: Vec<SetupPhase>,
}

#[derive(Clone, Debug, Serialize)]
pub struct TariAddressUpdatePayload {
    pub tari_address_base58: String,
    pub tari_address_emoji: String,
    pub tari_address_type: TariAddressType,
}
