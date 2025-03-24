use anyhow::Error;
use tauri::{AppHandle, Manager};

use log::info;

use crate::UniverseAppState;

use super::{
    progress_plans::ProgressPlans,
    progress_tracker_impl::{
        ProgressChannelEvent, ProgressPlanBuilderImpl, ProgressPlanExecutorImpl, ProgressStep,
    },
};

const LOG_TARGET: &str = "tari::universe::progress_tracker";

pub struct ProgressPlanExecutor {
    plan: Vec<ProgressPlans>,
    percentage_steps: Vec<f64>,
}
impl ProgressPlanExecutorImpl for ProgressPlanExecutor {
    async fn resolve_step(&mut self, app_handle: AppHandle) -> Result<(), Error> {
        let step = self
            .plan
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to resolve"))?;
        let percentage = self
            .percentage_steps
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to resolve"))?;

        let event = step.resolve_to_event();

        let app_state = app_handle.state::<UniverseAppState>();
        app_state
            .events_manager
            .handle_progress_tracker_update(
                &app_handle,
                event.get_event_type(),
                event.get_title(),
                percentage,
                event.get_description(),
            )
            .await;

        Ok(())
    }
    fn skip_step(&mut self) -> Result<(), Error> {
        let step = self
            .plan
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to skip"))?;
        let percentage = self
            .percentage_steps
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to skip"))?;

        info!(
            target: LOG_TARGET,
            "Skipping step: {} with percentage: {}",
            step.resolve_to_event().get_title(),
            percentage
        );

        Ok(())
    }
}

pub struct ProgressPlanBuilder {
    plan: Vec<ProgressPlans>,
    percentage_steps: Vec<f64>,
}

impl ProgressPlanBuilderImpl<ProgressPlanExecutor> for ProgressPlanBuilder {
    type PlanElement = ProgressPlans;

    fn new() -> Self {
        ProgressPlanBuilder {
            plan: Vec::new(),
            percentage_steps: Vec::new(),
        }
    }

    fn add_step(&mut self, element: Self::PlanElement) -> &mut Self {
        self.plan.push(element);
        self
    }

    fn calculate_percentage_steps(&mut self) -> &mut Self {
        let total_weight: u8 = self
            .plan
            .iter()
            .map(|step| step.get_progress_weight())
            .sum();
        let mut current_percentage = 0.0;
        for step in &self.plan {
            let percentage = (step.get_progress_weight() as f64 / total_weight as f64) * 100.0;
            current_percentage += percentage;
            self.percentage_steps
                .push(current_percentage.max(100.0).round());
        }
        self
    }

    fn build(&self) -> ProgressPlanExecutor {
        ProgressPlanExecutor {
            plan: self.plan.clone().into_iter().rev().collect(),
            percentage_steps: self.percentage_steps.clone().into_iter().rev().collect(),
        }
    }
}
