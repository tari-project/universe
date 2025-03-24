use anyhow::Error;
use tauri::AppHandle;

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
#[allow(dead_code)]
pub trait ProgressPlanExecutorImpl {
    // App handle is optional only for testing purposes
    async fn resolve_step(&mut self, app_handle: Option<AppHandle>)
        -> Result<(String, f64), Error>;
    fn skip_step(&mut self) -> Result<(String, f64), Error>;
}
#[allow(dead_code)]
pub trait ProgressPlanBuilderImpl<Executor: ProgressPlanExecutorImpl> {
    type PlanElement: ProgressStep;

    fn new() -> Self;
    fn add_step(&mut self, element: Self::PlanElement) -> &mut Self;
    fn calculate_percentage_steps(&mut self) -> &mut Self;
    fn build(&self) -> Executor;
}
#[allow(dead_code)]
pub trait ProgressTrackerImpl {
    type PlanExecuter: ProgressPlanExecutorImpl;
    type PlanBuilder: ProgressPlanBuilderImpl<Self::PlanExecuter>;

    fn new() -> Self::PlanBuilder;
}
