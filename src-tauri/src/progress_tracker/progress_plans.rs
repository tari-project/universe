use crate::events_emitter::EventType;

use super::progress_tracker_impl::{ProgressChannelEvent, ProgressStep};

pub struct ProgressPlanEventPayload {
    event_type: EventType,
    title: String,
    description: Option<String>,
}

impl ProgressChannelEvent for ProgressPlanEventPayload {
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
    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressStartupPlan::InitializeApp => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerStartup,
                title: "Initializing app".to_string(),
                description: None,
            },
            ProgressStartupPlan::InitializeTor => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerStartup,
                title: "Initializing Tor".to_string(),
                description: None,
            },
            ProgressStartupPlan::InitializeNode => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerStartup,
                title: "Initializing Node".to_string(),
                description: None,
            },
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
    fn resolve_to_event(&self) -> Self::ChannelEvent {
        match self {
            ProgressResumePlan::InitializeWallet => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerResume,
                title: "Initializing wallet".to_string(),
                description: None,
            },
            ProgressResumePlan::InitializeTor => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerResume,
                title: "Initializing Tor".to_string(),
                description: None,
            },
            ProgressResumePlan::InitializeNode => ProgressPlanEventPayload {
                event_type: EventType::ProgressTrackerResume,
                title: "Initializing Node".to_string(),
                description: None,
            },
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
