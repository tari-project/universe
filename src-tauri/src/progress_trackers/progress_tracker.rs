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

use anyhow::Error;
use tauri::{AppHandle, Manager};

use log::{info, warn};

use crate::UniverseAppState;

use super::{
    progress_plans::ProgressPlans,
    trait_progress_tracker::{
        ProgressEvent, ProgressPlanBuilderImpl, ProgressPlanExecutorImpl, ProgressStep,
    },
};

const LOG_TARGET: &str = "tari::universe::progress_tracker";

pub struct ProgressPlanExecutor {
    plan: Vec<ProgressPlans>,
    percentage_steps: Vec<f64>,
}
impl ProgressPlanExecutorImpl for ProgressPlanExecutor {
    async fn resolve_step(
        &mut self,
        app_handle: Option<AppHandle>,
    ) -> Result<(String, f64), Error> {
        let step = self
            .plan
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to resolve"))?;
        let percentage = self
            .percentage_steps
            .pop()
            .ok_or(anyhow::anyhow!("No more steps to resolve"))?;

        let event = step.resolve_to_event();

        // App handle is optional only for current testing purposes
        match app_handle {
            Some(app_handle) => {
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
            }
            None => {
                warn!(
                    target: LOG_TARGET,
                    "No app handle provided, skipping progress tracker update"
                );
            }
        }

        Ok((event.get_title(), percentage))
    }
    fn skip_step(&mut self) -> Result<(String, f64), Error> {
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

        Ok((step.resolve_to_event().get_title(), percentage))
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
            let percentage =
                (f64::from(step.get_progress_weight()) / f64::from(total_weight)) * 100.0;
            current_percentage += percentage;
            self.percentage_steps
                .push(current_percentage.min(100.0).round());
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

#[cfg(test)]
mod tests {
    use crate::progress_trackers::progress_plans::ProgressResumePlan;

    use super::*;

    #[tokio::test]
    async fn test_progress_plan_builder_3() {
        let mut progress_tracker = ProgressPlanBuilder::new()
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Node))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Tor))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Wallet))
            .calculate_percentage_steps()
            .build();

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Node.get_title());
                assert_eq!(*percentage, 33.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Tor.get_title());
                assert_eq!(*percentage, 67.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Wallet.get_title());
                assert_eq!(*percentage, 100.0);
            });
    }

    #[tokio::test]
    async fn test_progress_plan_builder_5() {
        let mut progress_tracker = ProgressPlanBuilder::new()
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Node))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Tor))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Wallet))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Node))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Tor))
            .calculate_percentage_steps()
            .build();

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Node.get_title());
                assert_eq!(*percentage, 20.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Tor.get_title());
                assert_eq!(*percentage, 40.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Wallet.get_title());
                assert_eq!(*percentage, 60.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Node.get_title());
                assert_eq!(*percentage, 80.0);
            });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Tor.get_title());
                assert_eq!(*percentage, 100.0);
            });
    }

    #[tokio::test]
    async fn test_progress_plan_builder_3_skip() {
        let mut progress_tracker = ProgressPlanBuilder::new()
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Node))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Tor))
            .add_step(ProgressPlans::Resume(ProgressResumePlan::Wallet))
            .calculate_percentage_steps()
            .build();

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Node.get_title());
                assert_eq!(*percentage, 33.0);
            });

        let _unused = progress_tracker.skip_step().inspect(|(title, percentage)| {
            assert_eq!(*title, ProgressResumePlan::Tor.get_title());
            assert_eq!(*percentage, 67.0);
        });

        let _unused = progress_tracker
            .resolve_step(None)
            .await
            .inspect(|(title, percentage)| {
                assert_eq!(*title, ProgressResumePlan::Wallet.get_title());
                assert_eq!(*percentage, 100.0);
            });
    }
}
