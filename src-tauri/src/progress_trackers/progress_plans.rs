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

use crate::events::EventType;

pub trait ProgressEvent {
    fn get_event_type(&self) -> EventType;
    fn get_title(&self) -> String;
    fn get_description(&self) -> Option<String>;
}

pub trait ProgressStep {
    type ChannelEvent: ProgressEvent;
    fn resolve_to_event(&self) -> Self::ChannelEvent;
    fn get_progress_weight(&self) -> u8;
    fn get_event_type(&self) -> EventType;
    fn get_title(&self) -> String;
    fn get_description(&self) -> Option<String>;
}

pub struct ProgressPlanEventPayload {
    event_type: EventType,
    title: String,
    description: Option<String>,
}

impl ProgressEvent for ProgressPlanEventPayload {
    fn get_event_type(&self) -> EventType {
        self.event_type.clone()
    }

    fn get_title(&self) -> String {
        self.title.clone()
    }

    fn get_description(&self) -> Option<String> {
        self.description.clone()
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
}

impl ProgressStep for ProgressSetupCorePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_description(&self) -> Option<String> {
        None
    }

    fn get_event_type(&self) -> EventType {
        EventType::ProgressTrackerStartup
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
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressSetupCorePlan::PlatformPrequisites => {
                "setup-core.platform-prequisites".to_string()
            }
            ProgressSetupCorePlan::InitializeApplicationModules => {
                "setup-core.initialize-application-modules".to_string()
            }
            ProgressSetupCorePlan::NetworkSpeedTest => "setup-core.network-speed-test".to_string(),
            ProgressSetupCorePlan::BinariesTor => "setup-core.binaries-tor".to_string(),
            ProgressSetupCorePlan::BinariesNode => "setup-core.binaries-node".to_string(),
            ProgressSetupCorePlan::BinariesWallet => "setup-core.binaries-wallet".to_string(),
            ProgressSetupCorePlan::BinariesCpuMiner => "setup-core.binaries-cpu-miner".to_string(),
            ProgressSetupCorePlan::BinariesGpuMiner => "setup-core.binaries-gpu-miner".to_string(),
            ProgressSetupCorePlan::BinariesP2pool => "setup-core.binaries-p2pool".to_string(),
            ProgressSetupCorePlan::BinariesMergeMiningProxy => {
                "setup-core.binaries-merge-mining-proxy".to_string()
            }
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
            description: self.get_description(),
        }
    }
}

#[allow(dead_code)]
#[derive(Clone, PartialEq)]
pub enum ProgressPlans {
    SetupCore(ProgressSetupCorePlan),
}
#[allow(dead_code)]
impl ProgressPlans {
    fn get_event_type(&self) -> EventType {
        match self {
            ProgressPlans::SetupCore(_) => EventType::ProgressTrackerStartup,
        }
    }
}

impl ProgressStep for ProgressPlans {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_description(&self) -> Option<String> {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_description(),
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_event_type(),
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_title(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressPlans::SetupCore(plan) => plan.resolve_to_event(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressPlans::SetupCore(plan) => plan.get_progress_weight(),
        }
    }
}
