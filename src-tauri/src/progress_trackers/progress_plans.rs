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

#[derive(Clone, Eq, PartialEq, Hash, Debug)]
pub enum SetupStep {
    // Core Phase
    InitializeApplicationModules,
    NetworkSpeedTest,

    // Node Phase
    BinariesTor,
    BinariesNode,
    BinariesWallet,
    StartTor,
    MigratingDatabase,
    StartingNode,

    // Cpu Mining Phase
    BinariesCpuMiner,
    BinariesMergeMiningProxy,
    MMProxy,
    InitializeCpuHardware,

    // Gpu Mining Phase
    BinariesGpuMiner,
    DetectGpu,
    InitializeGpuHardware,

    // Wallet Phase
    StartWallet,
    SetupBridge,
}

impl SetupStep {
    /// Returns the i18n key for the step, used for localization. <br>
    /// It should reference entry in on of the json's in `public/locales/`
    pub fn get_i18n_key(&self) -> String {
        match self {
            // Core Phase
            Self::InitializeApplicationModules => "initialize-application-modules".to_string(),
            Self::NetworkSpeedTest => "network-speed-test".to_string(),

            // Node Phase
            Self::BinariesTor => "binaries-tor".to_string(),
            Self::BinariesNode => "binaries-node".to_string(),
            Self::StartTor => "start-tor".to_string(),
            Self::MigratingDatabase => "migrating-database".to_string(),
            Self::StartingNode => "starting-node".to_string(),

            // Cpu Mining Phase
            Self::BinariesCpuMiner => "binaries-cpu-miner".to_string(),
            Self::BinariesMergeMiningProxy => "binaries-merge-mining-proxy".to_string(),
            Self::MMProxy => "mm-proxy".to_string(),
            Self::InitializeCpuHardware => "initialize-cpu-hardware".to_string(),

            // Gpu Mining Phase
            Self::BinariesGpuMiner => "binaries-gpu-miner".to_string(),
            Self::DetectGpu => "detect-gpu".to_string(),
            Self::InitializeGpuHardware => "initialize-gpu-hardware".to_string(),

            // Wallet Phase
            Self::BinariesWallet => "binaries-wallet".to_string(),
            Self::StartWallet => "start-wallet".to_string(),
            Self::SetupBridge => "setup-bridge".to_string(),
        }
    }

    /// Returns the progress value ( **percentage** ) for the step, used to calculate the overall progress of the setup process.
    // This is used to determine how much progress has been made in the setup process.
    // The values should be in range 0-100 and all steps should add up to 100.
    pub fn get_progress_value(&self) -> u8 {
        match self {
            // Core Phase 5
            Self::InitializeApplicationModules => 1,
            Self::NetworkSpeedTest => 4,

            // Node Phase 40
            Self::BinariesTor => 5,
            Self::BinariesNode => 5,
            Self::StartTor => 5,
            Self::MigratingDatabase => 2,
            Self::StartingNode => 23,

            // Cpu Mining Phase 20
            Self::BinariesCpuMiner => 8,
            Self::BinariesMergeMiningProxy => 5,
            Self::MMProxy => 5,
            Self::InitializeCpuHardware => 2,

            // Gpu Mining Phase 15
            Self::BinariesGpuMiner => 10,
            Self::DetectGpu => 3,
            Self::InitializeGpuHardware => 2,

            // Wallet Phase 20
            Self::BinariesWallet => 10,
            Self::StartWallet => 5,
            Self::SetupBridge => 5,
        }
    }
}
