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
use tokio::sync::{RwLock, watch::Sender};

use crate::{
    LOG_TARGET_APP_LOGIC, UniverseAppState,
    events::ProgressTrackerUpdatePayload,
    events_emitter::EventsEmitter,
    progress_trackers::progress_plans::SetupStep,
    setup::{
        setup_manager::{PhaseStatus, SetupPhase},
        utils::timeout_watcher::hash_value,
    },
};

#[derive(Debug)]
struct ProgressAccumulator {
    total_progress: f64,
    expected_total: f64,
    step_contributions: HashMap<SetupStep, f64>,
}

impl ProgressAccumulator {
    fn new(expected_total: f64) -> Self {
        Self {
            total_progress: 0.0,
            expected_total,
            step_contributions: HashMap::new(),
        }
    }

    fn add_step_progress(&mut self, step: &SetupStep) {
        if !self.step_contributions.contains_key(step) {
            let progress = f64::from(step.get_progress_value());
            self.total_progress += progress;
            self.step_contributions.insert(step.clone(), progress);
        }
    }

    fn add_incremental_progress(&mut self, amount: f64) {
        self.total_progress += amount;
    }

    fn get_total_progress(&self) -> f64 {
        self.total_progress
    }

    fn is_completed(&self) -> bool {
        self.total_progress >= self.expected_total
    }
}

#[derive(Clone)]
pub struct IncrementalProgressTracker {
    step: SetupStep,
    last_reported_percentage: Arc<RwLock<f64>>,
    accumulator: Arc<RwLock<ProgressAccumulator>>,
    timeout_watcher_sender: Sender<u64>,
    setup_phase: SetupPhase,
}

impl std::fmt::Debug for IncrementalProgressTracker {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("IncrementalProgressTracker")
            .field("step", &self.step)
            .field("setup_phase", &self.setup_phase)
            .finish()
    }
}

impl IncrementalProgressTracker {
    /// Updates the progress tracker with the current step completion percentage.
    /// This method should be called periodically to update the progress tracker.
    /// ### Arguments
    /// * `params` - extra data that will be displayed in the UI
    /// * `current_step_completion` - value between 0.0 and 1.0 representing the current step completion percentage
    pub async fn send_update(&self, params: HashMap<String, String>, current_step_completion: f64) {
        let step_progress_value = f64::from(self.step.get_progress_value());
        let resolved_percentage = step_progress_value * current_step_completion;

        let last_percentage = *self.last_reported_percentage.read().await;

        // Calculate the delta (incremental progress)
        let delta = resolved_percentage - last_percentage;

        let mut accumulator = self.accumulator.write().await;
        accumulator.add_incremental_progress(delta);
        let total_progress = accumulator.get_total_progress();
        let is_completed = accumulator.is_completed();
        drop(accumulator);

        let payload = ProgressTrackerUpdatePayload {
            phase_title: self.setup_phase.get_i18n_title_key(),
            title: self.step.get_i18n_key(),
            progress: total_progress,
            title_params: Some(params),
            setup_phase: self.setup_phase.clone(),
            is_completed,
        };

        let _unused = self.timeout_watcher_sender.send(hash_value(&payload));
        EventsEmitter::emit_progress_tracker_update(payload).await;

        *self.last_reported_percentage.write().await = resolved_percentage;
    }
}

#[derive(Clone, Debug)]
enum StepTracker {
    Instant {
        step: SetupStep,
        is_required: bool,
    },
    Incremental {
        step: SetupStep,
        is_required: bool,
        tracker: Option<IncrementalProgressTracker>,
    },
}

impl StepTracker {
    fn get_step(&self) -> &SetupStep {
        match self {
            StepTracker::Instant { step, .. } => step,
            StepTracker::Incremental { step, .. } => step,
        }
    }

    fn is_required(&self) -> bool {
        match self {
            StepTracker::Instant { is_required, .. } => *is_required,
            StepTracker::Incremental { is_required, .. } => *is_required,
        }
    }
}

pub struct ProgressStepper {
    steps: Vec<StepTracker>,
    app_handle: AppHandle,
    timeout_watcher_sender: Sender<u64>,
    status_sender: Sender<PhaseStatus>,
    setup_phase: SetupPhase,
    setup_warnings: HashMap<SetupStep, String>,
    accumulator: Arc<RwLock<ProgressAccumulator>>,
}

impl ProgressStepper {
    pub fn get_setup_warnings(&self) -> &HashMap<SetupStep, String> {
        &self.setup_warnings
    }

    /// After the action is completed it will handle all sideeffects related to step completion with ``self.emit_completion_update`` or ``self.handle_step_error``.
    /// ### Arguments
    /// * `step` - the step to complete e.g. `SetupStep::BinariesWallet`
    /// * `action` - action that will be executed to complete the step, it should return a Result indicating success or failure
    /// ### Returns
    /// If step is required for phase to complete successfully, it will return an error if the action fails.
    /// If step is not required, it will log the error and continue without failing the phase
    pub async fn complete_step<F, Fut>(
        &mut self,
        step: SetupStep,
        action: F,
    ) -> Result<(), anyhow::Error>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<(), anyhow::Error>>,
    {
        if let Some(index) = self.steps.iter().position(|s| s.get_step() == &step) {
            let step_tracker = self.steps.remove(index);
            let progress_before_action = self.accumulator.read().await.total_progress;

            match action().await {
                Ok(_) => {
                    // For binaries downloads, when it does download files, tracker will count progress
                    // But if it is already downloaded, tracker won't be active so we need to add progress manually
                    if progress_before_action.eq(&self.accumulator.read().await.total_progress) {
                        self.accumulator.write().await.add_step_progress(&step);
                    }
                    self.emit_completion_update(&step).await;
                    Ok(())
                }
                Err(e) => self.handle_step_error(step_tracker, e).await,
            }
        } else {
            Ok(()) // Step not found, possibly already completed
        }
    }

    ///   Tracks the step incrementally, allowing for progress updates to be sent during the step execution.
    ///   ### Arguments
    /// * `step` - the step to track e.g. `SetupStep::BinariesWallet`
    ///   ### Returns
    /// * `IncrementalProgressTracker` that can be used to send progress updates.
    ///   This method will create a new `IncrementalProgressTracker` for the step if it doesn't already exist.
    ///   If the step is already being tracked, it will return the existing tracker.
    pub fn track_step_incrementally(
        &mut self,
        step: SetupStep,
    ) -> Option<IncrementalProgressTracker> {
        if let Some(StepTracker::Incremental { tracker, .. }) =
            self.steps.iter_mut().find(|s| s.get_step() == &step)
        {
            if tracker.is_none() {
                let incremental_tracker = IncrementalProgressTracker {
                    step: step.clone(),
                    last_reported_percentage: Arc::new(RwLock::new(0.0)),
                    accumulator: self.accumulator.clone(),
                    timeout_watcher_sender: self.timeout_watcher_sender.clone(),
                    setup_phase: self.setup_phase.clone(),
                };

                *tracker = Some(incremental_tracker.clone());
                return Some(incremental_tracker);
            }
        }
        None
    }

    /// Works similar to `complete_step`, but it doesn't require an action to be executed.
    /// It simply marks the step as completed and updates the progress accumulator.
    /// ### Arguments
    /// * `step` - the step to complete e.g. `SetupStep::BinariesWallet`
    /// * `error` - an optional error that occurred during the step execution
    /// ### Returns
    /// Result indicating success or failure of the step completion
    /// This method will remove the step from the list of steps and update the progress accumulator.
    #[allow(dead_code)]
    pub async fn finish_tracked_step(
        &mut self,
        step: SetupStep,
        error: Option<anyhow::Error>,
    ) -> Result<(), anyhow::Error> {
        if let Some(index) = self.steps.iter().position(|s| s.get_step() == &step) {
            let step_tracker = self.steps.remove(index);
            if let Some(err) = error {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to complete step: {err}");
                self.handle_step_error(step_tracker, err).await?;
            } else {
                self.emit_completion_update(&step).await;
            }
            Ok(())
        } else {
            Ok(()) // Step not found, possibly already completed
        }
    }

    /// Resolves step as completed successfully and emits the completion update.
    /// ### Arguments
    /// * `step` - the step to skip e.g. `SetupStep::BinariesWallet`
    #[allow(dead_code)]
    pub async fn skip_step(&mut self, step: SetupStep) -> Result<(), anyhow::Error> {
        if let Some(index) = self.steps.iter().position(|s| s.get_step() == &step) {
            let removed_step = self.steps.remove(index);
            let removed_step = removed_step.get_step();
            self.accumulator
                .write()
                .await
                .add_step_progress(removed_step);

            self.emit_completion_update(removed_step).await;
        }
        Ok(())
    }

    /// Handles side effects of successfully completing a step like: <br>
    /// - Emitting progress tracker update event <br>
    /// - Updating timeout watcher <br>
    /// - Sending telemetry event <br>
    /// ### Arguments
    /// * `step` - the step to skip e.g. `SetupStep::BinariesWallet`
    async fn emit_completion_update(&self, step: &SetupStep) {
        let accumulator = self.accumulator.read().await;
        let total_progress = accumulator.get_total_progress();
        let is_completed = accumulator.is_completed();
        drop(accumulator);

        let payload = ProgressTrackerUpdatePayload {
            phase_title: self.setup_phase.get_i18n_title_key(),
            title: step.get_i18n_key(),
            progress: total_progress,
            title_params: None,
            setup_phase: self.setup_phase.clone(),
            is_completed,
        };

        let _unused = self
            .timeout_watcher_sender
            .send(hash_value(&payload))
            .inspect_err(|e| {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
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
                    "step": step.get_i18n_key(),
                    "percentage": step.get_progress_value(),
                    "is_completed": self.steps.is_empty(),
                }),
            )
            .await;
    }

    /// Handles errors that occur during step execution.
    /// If the step is required, it will send a failure status to the status sender.
    /// If the step is not required, it will log the error and continue without failing the phase.
    /// ### Arguments
    /// * `step_tracker` - the step tracker that contains the step and its required status
    /// * `error` - the error that occurred during the step execution
    async fn handle_step_error(
        &mut self,
        step_tracker: StepTracker,
        error: anyhow::Error,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET_APP_LOGIC, "Failed to complete step: {error}");

        if step_tracker.is_required() {
            let error_message = format!(
                "failed-to-complete-step: {}. Error: {}",
                step_tracker.get_step().get_i18n_key(),
                error
            );
            self.status_sender
                .send(PhaseStatus::Failed(error_message.clone()))
                .ok();
            Err(anyhow::anyhow!(error_message))
        } else {
            self.setup_warnings
                .insert(step_tracker.get_step().clone(), error.to_string());
            Ok(())
        }
    }
}

pub struct ProgressStepperBuilder {
    steps: Vec<StepTracker>,
}

impl ProgressStepperBuilder {
    pub fn new() -> Self {
        ProgressStepperBuilder { steps: Vec::new() }
    }

    pub fn get_expected_progress(&self) -> f64 {
        self.steps
            .iter()
            .map(|step| f64::from(step.get_step().get_progress_value()))
            .sum()
    }

    pub fn add_step(&mut self, setup_step: SetupStep, is_required: bool) -> &mut Self {
        self.steps.push(StepTracker::Instant {
            step: setup_step,
            is_required,
        });
        self
    }

    pub fn add_incremental_step(&mut self, setup_step: SetupStep, is_required: bool) -> &mut Self {
        self.steps.push(StepTracker::Incremental {
            step: setup_step,
            is_required,
            tracker: None,
        });
        self
    }

    pub fn build(
        &mut self,
        app_handle: AppHandle,
        timeout_watcher_sender: Sender<u64>,
        status_sender: Sender<PhaseStatus>,
        setup_phase: SetupPhase,
    ) -> ProgressStepper {
        let expected_progress = self.get_expected_progress();

        ProgressStepper {
            steps: self.steps.clone(),
            app_handle,
            timeout_watcher_sender,
            status_sender,
            setup_phase,
            setup_warnings: HashMap::new(),
            accumulator: Arc::new(RwLock::new(ProgressAccumulator::new(expected_progress))),
        }
    }
}
