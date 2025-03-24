use anyhow::Error;
use tauri::AppHandle;

use crate::events_emitter::EventType;

pub trait ProgressChannelEvent {
    fn get_event_type(&self) -> EventType;
    fn get_title(&self) -> String;
    fn get_description(&self) -> Option<String>;
}

pub trait ProgressStep {
    type ChannelEvent: ProgressChannelEvent;
    fn resolve_to_event(&self) -> Self::ChannelEvent;
    fn get_progress_weight(&self) -> u8;
}

pub trait ProgressPlanExecutorImpl {
    async fn resolve_step(&mut self, app_handle: AppHandle) -> Result<(), Error>;
    fn skip_step(&mut self) -> Result<(), Error>;
}

pub trait ProgressPlanBuilderImpl<Executor: ProgressPlanExecutorImpl> {
    type PlanElement: ProgressStep;

    fn new() -> Self;
    fn add_step(&mut self, element: Self::PlanElement) -> &mut Self;
    fn calculate_percentage_steps(&mut self) -> &mut Self;
    fn build(&self) -> Executor;
}

pub trait ProgressTrackerImpl {
    type PlanExecuter: ProgressPlanExecutorImpl;
    type PlanBuilder: ProgressPlanBuilderImpl<Self::PlanExecuter>;

    fn new() -> Self::PlanBuilder;
}
