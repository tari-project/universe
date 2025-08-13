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
            ProgressSetupCorePlan::InitializeApplicationModules => 1,
            ProgressSetupCorePlan::NetworkSpeedTest => 1,
            ProgressSetupCorePlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
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
    BinariesWallet,
    StartTor,
    MigratingDatabase,
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
            ProgressSetupNodePlan::BinariesWallet => 1,
            ProgressSetupNodePlan::StartTor => 1,
            ProgressSetupNodePlan::MigratingDatabase => 1,
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
            ProgressSetupNodePlan::BinariesWallet => "binaries-wallet".to_string(),
            ProgressSetupNodePlan::StartTor => "start-tor".to_string(),
            ProgressSetupNodePlan::MigratingDatabase => "migrating-database".to_string(),
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
pub enum ProgressSetupWalletPlan {
    StartWallet,
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
            ProgressSetupWalletPlan::StartWallet => 1,
            ProgressSetupWalletPlan::SetupBridge => 1,
            ProgressSetupWalletPlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupWalletPlan::StartWallet => "start-wallet".to_string(),

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
pub enum ProgressSetupCpuMiningPlan {
    BinariesCpuMiner,
    BinariesMergeMiningProxy,
    MMProxy,
    Done,
}
impl ProgressStep for ProgressSetupCpuMiningPlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Mining
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupCpuMiningPlan::BinariesCpuMiner => 2,
            ProgressSetupCpuMiningPlan::BinariesMergeMiningProxy => 1,
            ProgressSetupCpuMiningPlan::MMProxy => 1,
            ProgressSetupCpuMiningPlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupCpuMiningPlan::BinariesCpuMiner => "binaries-cpu-miner".to_string(),
            ProgressSetupCpuMiningPlan::BinariesMergeMiningProxy => {
                "binaries-merge-mining-proxy".to_string()
            }
            ProgressSetupCpuMiningPlan::MMProxy => "mm-proxy".to_string(),
            ProgressSetupCpuMiningPlan::Done => "done".to_string(),
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
pub enum ProgressSetupGpuMiningPlan {
    BinariesGlytexMiner,
    BinariesGraxilMiner,
    GlytexDetectGPU,
    GraxilDetectGPU,
    Done,
}

impl ProgressStep for ProgressSetupGpuMiningPlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::Hardware
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupGpuMiningPlan::BinariesGlytexMiner => 2,
            ProgressSetupGpuMiningPlan::BinariesGraxilMiner => 1,
            ProgressSetupGpuMiningPlan::GlytexDetectGPU => 1,
            ProgressSetupGpuMiningPlan::GraxilDetectGPU => 1,
            ProgressSetupGpuMiningPlan::Done => 1,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupGpuMiningPlan::BinariesGlytexMiner => "binaries-glytex-miner".to_string(),
            ProgressSetupGpuMiningPlan::BinariesGraxilMiner => "binaries-graxil-miner".to_string(),
            ProgressSetupGpuMiningPlan::GlytexDetectGPU => "glytex-detect-gpu".to_string(),
            ProgressSetupGpuMiningPlan::GraxilDetectGPU => "graxil-detect-gpu".to_string(),
            ProgressSetupGpuMiningPlan::Done => "done".to_string(),
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
    CpuMining(ProgressSetupCpuMiningPlan),
    GpuMining(ProgressSetupGpuMiningPlan),
    Node(ProgressSetupNodePlan),
    Wallet(ProgressSetupWalletPlan),
}
#[allow(dead_code)]
impl ProgressPlans {
    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::Core(plan) => plan.get_event_type(),
            ProgressPlans::GpuMining(plan) => plan.get_event_type(),
            ProgressPlans::CpuMining(plan) => plan.get_event_type(),
            ProgressPlans::Node(plan) => plan.get_event_type(),
            ProgressPlans::Wallet(plan) => plan.get_event_type(),
        }
    }
}

impl ProgressStep for ProgressPlans {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::Core(plan) => plan.get_event_type(),
            ProgressPlans::GpuMining(plan) => plan.get_event_type(),
            ProgressPlans::CpuMining(plan) => plan.get_event_type(),
            ProgressPlans::Node(plan) => plan.get_event_type(),
            ProgressPlans::Wallet(plan) => plan.get_event_type(),
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressPlans::Core(plan) => plan.get_title(),
            ProgressPlans::GpuMining(plan) => plan.get_title(),
            ProgressPlans::CpuMining(plan) => plan.get_title(),
            ProgressPlans::Node(plan) => plan.get_title(),
            ProgressPlans::Wallet(plan) => plan.get_title(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressPlans::Core(plan) => plan.resolve_to_event(),
            ProgressPlans::GpuMining(plan) => plan.resolve_to_event(),
            ProgressPlans::CpuMining(plan) => plan.resolve_to_event(),
            ProgressPlans::Node(plan) => plan.resolve_to_event(),
            ProgressPlans::Wallet(plan) => plan.resolve_to_event(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressPlans::Core(plan) => plan.get_progress_weight(),
            ProgressPlans::GpuMining(plan) => plan.get_progress_weight(),
            ProgressPlans::CpuMining(plan) => plan.get_progress_weight(),
            ProgressPlans::Node(plan) => plan.get_progress_weight(),
            ProgressPlans::Wallet(plan) => plan.get_progress_weight(),
        }
    }
}

impl ProgressPlans {
    pub fn get_phase_title(&self) -> String {
        match self {
            ProgressPlans::Core(_) => "setup-core".to_string(),
            ProgressPlans::GpuMining(_) => "setup-gpu-mining".to_string(),
            ProgressPlans::CpuMining(_) => "setup-cpu-mining".to_string(),
            ProgressPlans::Node(_) => "setup-local-node".to_string(),
            ProgressPlans::Wallet(_) => "setup-wallet".to_string(),
        }
    }

    pub fn get_phase_percentage_multiplyer(&self) -> f64 {
        match self {
            ProgressPlans::Core(_) => 0.2,
            ProgressPlans::GpuMining(_) => 0.1,
            ProgressPlans::CpuMining(_) => 0.1,
            ProgressPlans::Node(_) => 0.4,
            ProgressPlans::Wallet(_) => 0.1,
        }
    }

    pub fn get_phase_base_percentage(&self) -> f64 {
        match self {
            ProgressPlans::Core(_) => 0.0,
            ProgressPlans::Node(_) => 20.0,
            ProgressPlans::GpuMining(_) => 40.0,
            ProgressPlans::CpuMining(_) => 60.0,
            ProgressPlans::Wallet(_) => 80.0,
        }
    }
}
