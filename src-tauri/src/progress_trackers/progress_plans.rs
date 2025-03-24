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

use super::trait_progress_tracker::{ProgressEvent, ProgressStep};

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

#[allow(dead_code)]
#[derive(Clone)]
pub enum ProgressStartupPlan {
    App,
    Tor,
    Node,
}

impl ProgressStep for ProgressStartupPlan {
    type ChannelEvent = ProgressPlanEventPayload;
    fn get_description(&self) -> Option<String> {
        match self {
            ProgressStartupPlan::App => None,
            ProgressStartupPlan::Tor => None,
            ProgressStartupPlan::Node => None,
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressStartupPlan::App => EventType::ProgressTrackerStartup,
            ProgressStartupPlan::Tor => EventType::ProgressTrackerStartup,
            ProgressStartupPlan::Node => EventType::ProgressTrackerStartup,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressStartupPlan::App => "Initializing app".to_string(),
            ProgressStartupPlan::Tor => "Initializing Tor".to_string(),
            ProgressStartupPlan::Node => "Initializing Node".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
            description: self.get_description(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressStartupPlan::App => 1,
            ProgressStartupPlan::Tor => 1,
            ProgressStartupPlan::Node => 1,
        }
    }
}
#[allow(dead_code)]
#[derive(Clone)]
pub enum ProgressResumePlan {
    Wallet,
    Tor,
    Node,
}

impl ProgressStep for ProgressResumePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_description(&self) -> Option<String> {
        match self {
            ProgressResumePlan::Wallet => None,
            ProgressResumePlan::Tor => None,
            ProgressResumePlan::Node => None,
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressResumePlan::Wallet => EventType::ProgressTrackerResume,
            ProgressResumePlan::Tor => EventType::ProgressTrackerResume,
            ProgressResumePlan::Node => EventType::ProgressTrackerResume,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressResumePlan::Wallet => "Initializing wallet".to_string(),
            ProgressResumePlan::Tor => "Initializing Tor".to_string(),
            ProgressResumePlan::Node => "Initializing Node".to_string(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        ProgressPlanEventPayload {
            event_type: self.get_event_type(),
            title: self.get_title(),
            description: self.get_description(),
        }
    }
    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressResumePlan::Wallet => 1,
            ProgressResumePlan::Tor => 1,
            ProgressResumePlan::Node => 1,
        }
    }
}
#[allow(dead_code)]
#[derive(Clone)]
pub enum ProgressPlans {
    Startup(ProgressStartupPlan),
    Resume(ProgressResumePlan),
}
#[allow(dead_code)]
impl ProgressPlans {
    fn get_event_type(&self) -> EventType {
        match self {
            ProgressPlans::Resume(_) => EventType::ProgressTrackerResume,
            ProgressPlans::Startup(_) => EventType::ProgressTrackerStartup,
        }
    }
}

impl ProgressStep for ProgressPlans {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_description(&self) -> Option<String> {
        match self {
            ProgressPlans::Resume(plan) => plan.get_description(),
            ProgressPlans::Startup(plan) => plan.get_description(),
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressPlans::Resume(plan) => plan.get_event_type(),
            ProgressPlans::Startup(plan) => plan.get_event_type(),
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressPlans::Resume(plan) => plan.get_title(),
            ProgressPlans::Startup(plan) => plan.get_title(),
        }
    }

    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressPlans::Resume(plan) => plan.resolve_to_event(),
            ProgressPlans::Startup(plan) => plan.resolve_to_event(),
        }
    }

    fn get_progress_weight(&self) -> u8 {
        match self {
            ProgressPlans::Resume(plan) => plan.get_progress_weight(),
            ProgressPlans::Startup(plan) => plan.get_progress_weight(),
        }
    }
}
