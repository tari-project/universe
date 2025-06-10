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

use crate::events::ProgressEvents;

pub trait ProgressEvent {
    fn get_event_type(&self) -> ProgressEvents;
    fn get_title(&self) -> String;
}

pub trait ProgressStep {
    type ChannelEvent: ProgressEvent;
    fn resolve_to_event(&self) -> Self::ChannelEvent;
    fn get_progress_weight(&self) -> u8;
    fn get_event_type(&self) -> ProgressEvents;
    fn get_title(&self) -> String;
}

pub struct ProgressPlanEventPayload {
    event_type: ProgressEvents,
    title: String,
}

impl ProgressEvent for ProgressPlanEventPayload {
    fn get_event_type(&self) -> ProgressEvents {
        self.event_type.clone()
    }

    fn get_title(&self) -> String {
        self.title.clone()
    }
}
#[derive(Clone, PartialEq, Debug)]
pub enum ProgressSetupCorePlan {
    PlatformPrequisites,
    InitializeApplicationModules,
    NetworkSpeedTest,
    Done,
}

impl ProgressStep for ProgressSetupCorePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Core
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupCorePlan::PlatformPrequisites => 1,
            ProgressSetupCorePlan::InitializeApplicationModules => 1,
            ProgressSetupCorePlan::NetworkSpeedTest => 1,
            ProgressSetupCorePlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupCorePlan::PlatformPrequisites => "platform-prequisites".to_string(),
            ProgressSetupCorePlan::InitializeApplicationModules => {
                "initialize-application-modules".to_string()
            }
            ProgressSetupCorePlan::NetworkSpeedTest => "network-speed-test".to_string(),

            ProgressSetupCorePlan::Done => "done".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub enum ProgressSetupNodePlan {
    BinariesTor,
    BinariesNode,
    StartTor,
    StartingNode,
    WaitingForInitialSync,
    WaitingForHeaderSync,
    WaitingForBlockSync,
    Done,
}

impl ProgressStep for ProgressSetupNodePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Node
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupNodePlan::BinariesTor => 1,
            ProgressSetupNodePlan::BinariesNode => 1,
            ProgressSetupNodePlan::StartTor => 1,
            ProgressSetupNodePlan::StartingNode => 1,
            ProgressSetupNodePlan::WaitingForInitialSync => 2,
            ProgressSetupNodePlan::WaitingForHeaderSync => 2,
            ProgressSetupNodePlan::WaitingForBlockSync => 4,
            ProgressSetupNodePlan::Done => 6,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupNodePlan::BinariesTor => "binaries-tor".to_string(),
            ProgressSetupNodePlan::BinariesNode => "binaries-node".to_string(),
            ProgressSetupNodePlan::StartTor => "start-tor".to_string(),
            ProgressSetupNodePlan::StartingNode => "starting-node".to_string(),
            ProgressSetupNodePlan::WaitingForInitialSync => "waiting-for-initial-sync".to_string(),
            ProgressSetupNodePlan::WaitingForHeaderSync => "waiting-for-header-sync".to_string(),
            ProgressSetupNodePlan::WaitingForBlockSync => "waiting-for-block-sync".to_string(),
            ProgressSetupNodePlan::Done => "done".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub enum ProgressSetupHardwarePlan {
    BinariesCpuMiner,
    BinariesGpuMiner,
    DetectGPU,
    RunCpuBenchmark,
    Done,
}

impl ProgressStep for ProgressSetupHardwarePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Hardware
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupHardwarePlan::BinariesCpuMiner => 2,
            ProgressSetupHardwarePlan::BinariesGpuMiner => 2,
            ProgressSetupHardwarePlan::DetectGPU => 1,
            ProgressSetupHardwarePlan::RunCpuBenchmark => 1,
            ProgressSetupHardwarePlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupHardwarePlan::BinariesCpuMiner => "binaries-cpu-miner".to_string(),
            ProgressSetupHardwarePlan::BinariesGpuMiner => "binaries-gpu-miner".to_string(),
            ProgressSetupHardwarePlan::DetectGPU => "detect-gpu".to_string(),
            ProgressSetupHardwarePlan::RunCpuBenchmark => "run-cpu-benchmark".to_string(),
            ProgressSetupHardwarePlan::Done => "done".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub enum ProgressSetupWalletPlan {
    BinariesWallet,
    StartWallet,
    InitializeSpendingWallet,
    SetupBridge,
    Done,
}

impl ProgressStep for ProgressSetupWalletPlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Wallet
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupWalletPlan::BinariesWallet => 2,
            ProgressSetupWalletPlan::StartWallet => 1,
            ProgressSetupWalletPlan::InitializeSpendingWallet => 1,
            ProgressSetupWalletPlan::SetupBridge => 1,
            ProgressSetupWalletPlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupWalletPlan::BinariesWallet => "binaries-wallet".to_string(),
            ProgressSetupWalletPlan::StartWallet => "start-wallet".to_string(),
            ProgressSetupWalletPlan::InitializeSpendingWallet => {
                "initialize-spending-wallet".to_string()
            }
            ProgressSetupWalletPlan::SetupBridge => "setup-bridge".to_string(),
            ProgressSetupWalletPlan::Done => "done".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
pub enum ProgressSetupMiningPlan {
    BinariesP2pool,
    BinariesMergeMiningProxy,
    P2Pool,
    MMProxy,
    Done,
}

impl ProgressStep for ProgressSetupMiningPlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Mining
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupMiningPlan::BinariesP2pool => 2,
            ProgressSetupMiningPlan::BinariesMergeMiningProxy => 2,
            ProgressSetupMiningPlan::P2Pool => 1,
            ProgressSetupMiningPlan::MMProxy => 1,
            ProgressSetupMiningPlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupMiningPlan::BinariesP2pool => "binaries-p2pool".to_string(),
            ProgressSetupMiningPlan::BinariesMergeMiningProxy => {
                "binaries-merge-mining-proxy".to_string()
            }
            ProgressSetupMiningPlan::P2Pool => "p2pool".to_string(),
            ProgressSetupMiningPlan::MMProxy => "mm-proxy".to_string(),
            ProgressSetupMiningPlan::Done => "done".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
        }
    }
}

#[allow(dead_code)]
#[derive(Clone, PartialEq, Debug)]
pub enum ProgressPlans {
    Core(ProgressSetupCorePlan),
    Node(ProgressSetupNodePlan),
    Hardware(ProgressSetupHardwarePlan),
    Wallet(ProgressSetupWalletPlan),
    Mining(ProgressSetupMiningPlan),
}
#[allow(dead_code)]
impl ProgressPlans {
    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::Core(plan) => plan.get_event_type(),
            ProgressPlans::Node(plan) => plan.get_event_type(),
            ProgressPlans::Hardware(plan) => plan.get_event_type(),
            ProgressPlans::Wallet(plan) => plan.get_event_type(),
            ProgressPlans::Mining(plan) => plan.get_event_type(),
        }
    }
}

impl ProgressStep for ProgressPlans {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::Core(plan) => plan.get_event_type(),
            ProgressPlans::Node(plan) => plan.get_event_type(),
            ProgressPlans::Hardware(plan) => plan.get_event_type(),
            ProgressPlans::Wallet(plan) => plan.get_event_type(),
            ProgressPlans::Mining(plan) => plan.get_event_type(),
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressPlans::Core(plan) => plan.get_title(),
            ProgressPlans::Node(plan) => plan.get_title(),
            ProgressPlans::Hardware(plan) => plan.get_title(),
            ProgressPlans::Wallet(plan) => plan.get_title(),
            ProgressPlans::Mining(plan) => plan.get_title(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressPlans::Core(plan) => plan.resolve_to_event(),
            ProgressPlans::Node(plan) => plan.resolve_to_event(),
            ProgressPlans::Hardware(plan) => plan.resolve_to_event(),
            ProgressPlans::Wallet(plan) => plan.resolve_to_event(),
            ProgressPlans::Mining(plan) => plan.resolve_to_event(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressPlans::Core(plan) => plan.get_progress_weight(),
            ProgressPlans::Node(plan) => plan.get_progress_weight(),
            ProgressPlans::Hardware(plan) => plan.get_progress_weight(),
            ProgressPlans::Wallet(plan) => plan.get_progress_weight(),
            ProgressPlans::Mining(plan) => plan.get_progress_weight(),
        }
    }
}

impl ProgressPlans {
    pub fn get_phase_title(&self) -> String {
        match self {
            ProgressPlans::Core(_) => "setup-core".to_string(),
            ProgressPlans::Node(_) => "setup-local-node".to_string(),
            ProgressPlans::Hardware(_) => "setup-hardware".to_string(),
            ProgressPlans::Wallet(_) => "setup-wallet".to_string(),
            ProgressPlans::Mining(_) => "setup-mining".to_string(),
        }
    }

    pub fn get_phase_percentage_multiplyer(&self) -> f64 {
        match self {
            ProgressPlans::Core(_) => 0.2,
            ProgressPlans::Node(_) => 0.4,
            ProgressPlans::Hardware(_) => 0.1,
            ProgressPlans::Wallet(_) => 0.1,
            ProgressPlans::Mining(_) => 0.1,
        }
    }

    pub fn get_phase_base_percentage(&self) -> f64 {
        match self {
            ProgressPlans::Core(_) => 0.0,
            ProgressPlans::Node(_) => 20.0,
            ProgressPlans::Hardware(_) => 60.0,
            ProgressPlans::Wallet(_) => 80.0,
            ProgressPlans::Mining(_) => 90.0,
        }
    }
}
