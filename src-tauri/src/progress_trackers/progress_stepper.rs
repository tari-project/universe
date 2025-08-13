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

use std::{collections::HashMap, sync::Arc};

use serde_json::json;
use tauri::{AppHandle, Manager};

use log::warn;
use tokio::sync::{watch::Sender, Mutex};

use crate::{
    events::ProgressTrackerUpdatePayload,
    events_emitter::EventsEmitter,
    progress_trackers::progress_plans::SetupStep,
    setup::{setup_manager::SetupPhase, utils::timeout_watcher::hash_value},
    UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::progress_tracker";

#[derive(Clone)]
pub struct TrackStepComplitionOverTime {
    tracked_step: SetupStep,
    last_send_percentage: Arc<Mutex<f64>>,
    timeout_watcher_sender: Sender<u64>,
    setup_phase: SetupPhase,
    expected_progress: f64,
}

impl TrackStepComplitionOverTime {
    /// Updates the progress tracker with the current step completion percentage.
    /// This method should be called periodically to update the progress tracker.
    /// ### Arguments
    /// * `params` - extra data that will be displayed in the UI
    /// * `current_step_complition` - value between 0.0 and 1.0 representing the current step completion percentage
    pub async fn send_update(&self, params: HashMap<String, String>, current_step_complition: f64) {
        let step_percentage = f64::from(self.tracked_step.get_progress_value());
        let mut resolved_percentage = step_percentage * current_step_complition;
        if (resolved_percentage - *self.last_send_percentage.lock().await).abs() < 0.01 {
            // If the percentage hasn't changed significantly, skip sending an update
            return;
        }

        if current_step_complition >= 1.0 {
            resolved_percentage = step_percentage;
        }

        let payload = ProgressTrackerUpdatePayload {
            phase_title: self.setup_phase.get_i18n_title_key(),
            title: self.tracked_step.get_i18n_key(),
            progress: resolved_percentage.clone(),
            title_params: Some(params.clone()),
            setup_phase: self.setup_phase.clone(),
            is_completed: resolved_percentage.ge(&self.expected_progress),
        };

        let _unused = &self.timeout_watcher_sender.send(hash_value(&payload));

        EventsEmitter::emit_progress_tracker_update(payload).await;
        *self.last_send_percentage.lock().await = resolved_percentage;
    }
}
pub struct ProgressStepper {
    setup_steps: Vec<SetupStep>,
    app_handle: AppHandle,
    timeout_watcher_sender: Sender<u64>,
    setup_phase: SetupPhase,
    expected_progress: f64,
}

impl ProgressStepper {
    pub async fn mark_step_as_completed(&mut self, completed_step: SetupStep) {
        if let Some(index) = self
            .setup_steps
            .iter()
            .position(|step| step.eq(&completed_step))
        {
            let resolved_step = self.setup_steps.remove(index);
            let progress_value = f64::from(resolved_step.get_progress_value());

            let payload = ProgressTrackerUpdatePayload {
                phase_title: self.setup_phase.get_i18n_title_key(),
                title: resolved_step.get_i18n_key(),
                progress: progress_value.clone(),
                title_params: None,
                setup_phase: self.setup_phase.clone(),
                is_completed: progress_value.ge(&self.expected_progress),
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

            EventsEmitter::emit_progress_tracker_update(payload).await;
            let app_state = self.app_handle.state::<UniverseAppState>();
            let _unused = app_state
                .telemetry_service
                .read()
                .await
                .send(
                    "progress-stepper".to_string(),
                    json!({
                        "step": resolved_step.get_i18n_key(),
                        "percentage": resolved_step.get_progress_value(),
                        "is_completed": self.setup_steps.is_empty(),
                    }),
                )
                .await;
        }
    }

    pub fn track_step_completion_over_time(
        &mut self,
        step_to_be_completed: SetupStep,
    ) -> Option<TrackStepComplitionOverTime> {
        if let Some(index) = self
            .setup_steps
            .iter()
            .position(|step| step.eq(&step_to_be_completed))
        {
            let resolved_step = self.setup_steps.remove(index);

            let channel_step_update = TrackStepComplitionOverTime {
                tracked_step: resolved_step.clone(),
                last_send_percentage: Arc::new(Mutex::new(0.0)),
                timeout_watcher_sender: self.timeout_watcher_sender.clone(),
                setup_phase: self.setup_phase.clone(),
                expected_progress: self.expected_progress,
            };

            return Some(channel_step_update);
        }

        None
    }

    pub async fn skip_step(&mut self, skipped_step: SetupStep) {
        if let Some(index) = self
            .setup_steps
            .iter()
            .position(|step| step.eq(&skipped_step))
        {
            let resolved_step = self.setup_steps.remove(index);
            let progress_value = f64::from(resolved_step.get_progress_value());

            let payload = ProgressTrackerUpdatePayload {
                phase_title: self.setup_phase.get_i18n_title_key(),
                title: resolved_step.get_i18n_key(),
                progress: progress_value.clone(),
                title_params: None,
                setup_phase: self.setup_phase.clone(),
                is_completed: progress_value.ge(&self.expected_progress),
            };

            let _unused = &self.timeout_watcher_sender.send(hash_value(&payload));

            EventsEmitter::emit_progress_tracker_update(payload).await;
        }
    }
}

pub struct ProgressStepperBuilder {
    setup_steps: Vec<SetupStep>,
}

impl ProgressStepperBuilder {
    pub fn new() -> Self {
        ProgressStepperBuilder {
            setup_steps: Vec::new(),
        }
    }

    pub fn get_expected_progress(&self) -> f64 {
        self.setup_steps
            .iter()
            .map(|step| f64::from(step.get_progress_value()))
            .sum()
    }

    pub fn add_step(&mut self, setup_step: SetupStep) -> &mut Self {
        self.setup_steps.push(setup_step);
        self
    }

    pub fn build(
        &mut self,
        app_handle: AppHandle,
        timeout_watcher_sender: Sender<u64>,
        setup_phase: SetupPhase,
    ) -> ProgressStepper {
        ProgressStepper {
            setup_steps: self.setup_steps.clone(),
            app_handle,
            timeout_watcher_sender,
            setup_phase,
            expected_progress: self.get_expected_progress(),
        }
    }
}
