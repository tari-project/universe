use crate::events::EventType;

use super::progress_tracker_impl::{ProgressEvent, ProgressStep};

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

#[derive(Clone)]
pub enum ProgressStartupPlan {
    InitializeApp,
    InitializeTor,
    InitializeNode,
}

impl ProgressStep for ProgressStartupPlan {
    type ChannelEvent = ProgressPlanEventPayload;
    fn get_description(&self) -> Option<String> {
        match self {
            ProgressStartupPlan::InitializeApp => None,
            ProgressStartupPlan::InitializeTor => None,
            ProgressStartupPlan::InitializeNode => None,
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressStartupPlan::InitializeApp => EventType::ProgressTrackerStartup,
            ProgressStartupPlan::InitializeTor => EventType::ProgressTrackerStartup,
            ProgressStartupPlan::InitializeNode => EventType::ProgressTrackerStartup,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressStartupPlan::InitializeApp => "Initializing app".to_string(),
            ProgressStartupPlan::InitializeTor => "Initializing Tor".to_string(),
            ProgressStartupPlan::InitializeNode => "Initializing Node".to_string(),
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
            ProgressStartupPlan::InitializeApp => 1,
            ProgressStartupPlan::InitializeTor => 1,
            ProgressStartupPlan::InitializeNode => 1,
        }
    }
}

#[derive(Clone)]
pub enum ProgressResumePlan {
    InitializeWallet,
    InitializeTor,
    InitializeNode,
}

impl ProgressStep for ProgressResumePlan {
    type ChannelEvent = ProgressPlanEventPayload;

    fn get_description(&self) -> Option<String> {
        match self {
            ProgressResumePlan::InitializeWallet => None,
            ProgressResumePlan::InitializeTor => None,
            ProgressResumePlan::InitializeNode => None,
        }
    }

    fn get_event_type(&self) -> EventType {
        match self {
            ProgressResumePlan::InitializeWallet => EventType::ProgressTrackerResume,
            ProgressResumePlan::InitializeTor => EventType::ProgressTrackerResume,
            ProgressResumePlan::InitializeNode => EventType::ProgressTrackerResume,
        }
    }

    fn get_title(&self) -> String {
        match self {
            ProgressResumePlan::InitializeWallet => "Initializing wallet".to_string(),
            ProgressResumePlan::InitializeTor => "Initializing Tor".to_string(),
            ProgressResumePlan::InitializeNode => "Initializing Node".to_string(),
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
            ProgressResumePlan::InitializeWallet => 1,
            ProgressResumePlan::InitializeTor => 1,
            ProgressResumePlan::InitializeNode => 1,
        }
    }
}

#[derive(Clone)]
pub enum ProgressPlans {
    Startup(ProgressStartupPlan),
    Resume(ProgressResumePlan),
}

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
