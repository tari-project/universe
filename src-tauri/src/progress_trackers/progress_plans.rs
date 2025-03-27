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
    fn get_phase_title(&self) -> String;
    fn get_title(&self) -> String;
}

pub trait ProgressStep {
    type ChannelEvent: ProgressEvent;
    fn resolve_to_event(&self) -> Self::ChannelEvent;
    fn get_progress_weight(&self) -> u8;
    fn get_event_type(&self) -> ProgressEvents;
    fn get_phase_title(&self) -> String;
    fn get_title(&self) -> String;
}

pub struct ProgressPlanEventPayload {
    event_type: ProgressEvents,
    phase_title: String,
    title: String,
}

impl ProgressEvent for ProgressPlanEventPayload {
    fn get_event_type(&self) -> ProgressEvents {
        self.event_type.clone()
    }

    fn get_phase_title(&self) -> String {
        self.phase_title.clone()
    }

    fn get_title(&self) -> String {
        self.title.clone()
    }
}
#[derive(Clone, PartialEq)]
pub enum ProgressSetupCorePlan {
    PlatformPrequisites,
    InitializeApplicationModules,
    NetworkSpeedTest,
    BinariesTor,
    BinariesNode,
    BinariesWallet,
    BinariesCpuMiner,
    BinariesGpuMiner,
    BinariesP2pool,
    BinariesMergeMiningProxy,
    StartTor,
}

impl ProgressStep for ProgressSetupCorePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::CorePhaseUpdate
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupCorePlan::PlatformPrequisites => 1,
            ProgressSetupCorePlan::InitializeApplicationModules => 1,
            ProgressSetupCorePlan::NetworkSpeedTest => 1,
            ProgressSetupCorePlan::BinariesTor => 2,
            ProgressSetupCorePlan::BinariesNode => 2,
            ProgressSetupCorePlan::BinariesWallet => 2,
            ProgressSetupCorePlan::BinariesCpuMiner => 2,
            ProgressSetupCorePlan::BinariesGpuMiner => 2,
            ProgressSetupCorePlan::BinariesP2pool => 2,
            ProgressSetupCorePlan::BinariesMergeMiningProxy => 2,
            ProgressSetupCorePlan::StartTor => 1,
        }
    }

    fn get_phase_title(&self) -> String {
        "setup-core".to_string()
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupCorePlan::PlatformPrequisites => "platform-prequisites".to_string(),
            ProgressSetupCorePlan::InitializeApplicationModules => {
                "initialize-application-modules".to_string()
            }
            ProgressSetupCorePlan::NetworkSpeedTest => "network-speed-test".to_string(),
            ProgressSetupCorePlan::BinariesTor => "binaries-tor".to_string(),
            ProgressSetupCorePlan::BinariesNode => "binaries-node".to_string(),
            ProgressSetupCorePlan::BinariesWallet => "binaries-wallet".to_string(),
            ProgressSetupCorePlan::BinariesCpuMiner => "binaries-cpu-miner".to_string(),
            ProgressSetupCorePlan::BinariesGpuMiner => "binaries-gpu-miner".to_string(),
            ProgressSetupCorePlan::BinariesP2pool => "binaries-p2pool".to_string(),
            ProgressSetupCorePlan::BinariesMergeMiningProxy => {
                "binaries-merge-mining-proxy".to_string()
            }
            ProgressSetupCorePlan::StartTor => "start-tor".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            phase_title: self.get_phase_title(),
            title: self.get_title(),
        }
    }
}

#[derive(Clone, PartialEq)]
pub enum ProgressSetupLocalNodePlan {
    StartingLocalNode,
    WaitingForInitialSync,
    WaitingForHeaderSync,
    WaitingForBlockSync,
}

impl ProgressStep for ProgressSetupLocalNodePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        ProgressEvents::LocalNodePhaseUpdate
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressSetupLocalNodePlan::StartingLocalNode => 1,
            ProgressSetupLocalNodePlan::WaitingForInitialSync => 1,
            ProgressSetupLocalNodePlan::WaitingForHeaderSync => 1,
            ProgressSetupLocalNodePlan::WaitingForBlockSync => 1,
        }
    }

    fn get_phase_title(&self) -> String {
        "setup-local-node".to_string()
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupLocalNodePlan::StartingLocalNode => "starting-local-node".to_string(),
            ProgressSetupLocalNodePlan::WaitingForInitialSync => {
                "waiting-for-initial-sync".to_string()
            }
            ProgressSetupLocalNodePlan::WaitingForHeaderSync => {
                "waiting-for-header-sync".to_string()
            }
            ProgressSetupLocalNodePlan::WaitingForBlockSync => "waiting-for-block-sync".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            phase_title: self.get_phase_title(),
            title: self.get_title(),
        }
    }
}

#[allow(dead_code)]
#[derive(Clone, PartialEq)]
pub enum ProgressPlans {
    SetupCore(ProgressSetupCorePlan),
    SetupLocalNode(ProgressSetupLocalNodePlan),
}
#[allow(dead_code)]
impl ProgressPlans {
    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_event_type(),
            ProgressPlans::SetupLocalNode(plan) => plan.get_event_type(),
        }
    }
}

impl ProgressStep for ProgressPlans {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_event_type(&self) -> ProgressEvents {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_event_type(),
            ProgressPlans::SetupLocalNode(plan) => plan.get_event_type(),
        }
    }

    fn get_phase_title(&self) -> String {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_phase_title(),
            ProgressPlans::SetupLocalNode(plan) => plan.get_phase_title(),
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_title(),
            ProgressPlans::SetupLocalNode(plan) => plan.get_title(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressPlans::SetupCore(plan) => plan.resolve_to_event(),
            ProgressPlans::SetupLocalNode(plan) => plan.resolve_to_event(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_progress_weight(),
            ProgressPlans::SetupLocalNode(plan) => plan.get_progress_weight(),
        }
    }
}
