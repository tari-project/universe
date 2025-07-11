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

use std::{
    collections::HashMap,
    ops::{Add, Mul},
};

use serde_json::json;
use tauri::{AppHandle, Manager};

use log::warn;
use tokio::sync::watch::Sender;

use crate::{
    events::ProgressTrackerUpdatePayload, events_emitter::EventsEmitter,
    setup::utils::timeout_watcher::hash_value, UniverseAppState,
};

use super::progress_plans::{ProgressEvent, ProgressPlans, ProgressStep};

const LOG_TARGET: &str = "tari::universe::progress_tracker";

#[derive(Clone)]
pub struct ChanneledStepUpdate {
    step: ProgressPlans,
    step_percentage: f64,
    next_step_percentage: Option<f64>,
    timeout_watcher_sender: Sender<u64>,
}

impl ChanneledStepUpdate {
    pub async fn send_update(&self, params: HashMap<String, String>, current_step_percentage: f64) {
        let resolved_percentage = self.step_percentage
            + (self
                .next_step_percentage
                .unwrap_or(100.0 * (1.0 - self.step.get_phase_percentage_multiplyer()))
                - self.step_percentage)
                * current_step_percentage;

        let payload = ProgressTrackerUpdatePayload {
            phase_title: self.step.get_phase_title(),
            title: self.step.get_title(),
            progress: resolved_percentage.round(),
            title_params: Some(params.clone()),
            is_complete: false,
        };

        let _unused = &self.timeout_watcher_sender.send(hash_value(&payload));

        EventsEmitter::emit_progress_tracker_update(self.step.get_event_type(), payload).await;
    }
}
pub struct ProgressStepper {
    plan: Vec<ProgressPlans>,
    percentage_steps: Vec<f64>,
    app_handle: AppHandle,
    timeout_watcher_sender: Sender<u64>,
}

impl ProgressStepper {
    pub async fn resolve_step(&mut self, step: ProgressPlans) {
        if let Some(index) = self.plan.iter().position(|x| x.eq(&step)) {
            let resolved_step = self.plan.remove(index);
            let resolved_percentage = self.percentage_steps.remove(index);

            let event = resolved_step.resolve_to_event();

            let is_completed = self.plan.is_empty();

            let payload = ProgressTrackerUpdatePayload {
                phase_title: resolved_step.get_phase_title(),
                title: event.get_title(),
                progress: resolved_percentage,
                title_params: None,
                is_complete: is_completed,
            };

            let _unused = &self
                .timeout_watcher_sender
                .send(hash_value(&payload))
                .inspect_err(|e| {
                    warn!(
                        target: LOG_TARGET,
                        "Failed to send timeout watcher signal: {e}"
                    );
                });

            EventsEmitter::emit_progress_tracker_update(event.get_event_type(), payload).await;
            let app_state = self.app_handle.state::<UniverseAppState>();
            let _unused = app_state
                .telemetry_service
                .read()
                .await
                .send(
                    "progress-stepper".to_string(),
                    json!({
                        "phase": resolved_step.get_phase_title(),
                        "step": event.get_title(),
                        "percentage": resolved_percentage,
                        "is_completed": is_completed,
                    }),
                )
                .await;
        } else {
            warn!(
                target: LOG_TARGET,
                "Step: {} not found in plan, skipping",
                step.get_title()
            );
        }
    }

    pub fn channel_step_range_updates(
        &mut self,
        step: ProgressPlans,
        next_step: Option<ProgressPlans>,
    ) -> Option<ChanneledStepUpdate> {
        if let Some(first_index) = self.plan.iter().position(|x| x.eq(&step)) {
            let resolved_step = self.plan.remove(first_index);
            let resolved_percentage = self.percentage_steps.remove(first_index);

            if let Some(next_step) = next_step {
                if let Some(next_index) = self.plan.iter().position(|x| x.eq(&next_step)) {
                    let next_step_percentage = self.percentage_steps.get(next_index).copied();
                    let channel_step_update = ChanneledStepUpdate {
                        step: resolved_step.clone(),
                        step_percentage: resolved_percentage,
                        next_step_percentage,
                        timeout_watcher_sender: self.timeout_watcher_sender.clone(),
                    };

                    return Some(channel_step_update);
                }
            } else {
                let channel_step_update = ChanneledStepUpdate {
                    step: resolved_step.clone(),
                    step_percentage: resolved_percentage,
                    next_step_percentage: None,
                    timeout_watcher_sender: self.timeout_watcher_sender.clone(),
                };

                return Some(channel_step_update);
            }
        };

        None
    }

    pub fn skip_step(&mut self, step: ProgressPlans) {
        if let Some(index) = self.plan.iter().position(|x| x.eq(&step)) {
            let _removed_step = self.plan.remove(index);
            let _removed_percentage = self.percentage_steps.remove(index);
        } else {
            warn!(
                target: LOG_TARGET,
                "Step: {} not found in plan, skipping",
                step.get_title()
            );
        }
    }
}

pub struct ProgressStepperBuilder {
    plan: Vec<ProgressPlans>,
    percentage_steps: Vec<f64>,
}

impl ProgressStepperBuilder {
    pub fn new() -> Self {
        ProgressStepperBuilder {
            plan: Vec::new(),
            percentage_steps: Vec::new(),
        }
    }

    pub fn add_step(&mut self, element: ProgressPlans) -> &mut Self {
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
            self.percentage_steps.push(
                current_percentage
                    .min(100.0)
                    .round()
                    .mul(step.get_phase_percentage_multiplyer())
                    .add(step.get_phase_base_percentage())
                    .round(),
            );
        }
        self
    }

    pub fn build(
        &mut self,
        app_handle: AppHandle,
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        self.calculate_percentage_steps();
        ProgressStepper {
            plan: self.plan.clone().into_iter().rev().collect(),
            percentage_steps: self.percentage_steps.clone().into_iter().rev().collect(),
            app_handle,
            timeout_watcher_sender,
        }
    }
}
