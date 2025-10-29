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

use log::info;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use tauri::{async_runtime::spawn, AppHandle, Manager};
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex, RwLock,
};

use crate::{
    configs::{config_core::ConfigCore, config_ui::ConfigUI, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    systemtray_manager::SystemTrayManager,
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};

static LOG_TARGET: &str = "universe::shutdown_manager";
static INSTANCE: LazyLock<ShutdownManager> = LazyLock::new(ShutdownManager::new);

pub struct WaitForComplition {
    sender: Sender<bool>,
    receiver: Mutex<Receiver<bool>>,
}

impl WaitForComplition {
    pub fn new() -> Self {
        let (sender, receiver) = tokio::sync::watch::channel(false);
        Self {
            sender,
            receiver: Mutex::new(receiver),
        }
    }

    pub fn set_as_complete(&self) {
        self.sender
            .send(true)
            .expect("Failed to send complete signal");
    }

    #[allow(dead_code)]
    pub async fn wait_for_completion(&self) -> Result<(), tokio::sync::watch::error::RecvError> {
        let mut receiver = self.receiver.lock().await;
        receiver.wait_for(|value| *value).await?;
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ShutdownMode {
    Direct,   // Shutdown after clicking X button in the window navigation bar
    Tasktray, // Shutdown after clicking "Quit" in the tasktray menu
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum ShutdownStep {
    ShutdownModeSelection,
    FeedbackSurvey,
    TaskTrayTriggeredShutdown,
    Exit,
}

pub struct ShutdownManager {
    app_handle: RwLock<Option<AppHandle>>,
    shutdown_sequence: RwLock<Vec<ShutdownStep>>,
    shudown_selection_notifier: RwLock<Option<WaitForComplition>>,
    feedback_survey_notifier: RwLock<Option<WaitForComplition>>,
    tasktray_shutdown_notifier: RwLock<Option<WaitForComplition>>,
}

impl ShutdownManager {
    pub fn new() -> Self {
        Self {
            app_handle: RwLock::new(None),
            shutdown_sequence: RwLock::new(Vec::new()),
            shudown_selection_notifier: RwLock::new(None),
            feedback_survey_notifier: RwLock::new(None),
            tasktray_shutdown_notifier: RwLock::new(None),
        }
    }

    pub async fn initialize_app_handle(&self, app_handle: tauri::AppHandle) {
        let mut handle = self.app_handle.write().await;
        *handle = Some(app_handle);
    }

    // ================= Main shutdown manager logic ================= //

    pub async fn initialize_shutdown_from_system_tray(&self) {
        // If shutdown sequence is already initialized, just mark tasktray shutdown as completed
        if !self.shutdown_sequence.read().await.is_empty() {
            self.mark_tasktray_shutdown_as_completed().await;
            return;
        }

        let was_feedback_sent = ConfigUI::content().await.was_feedback_sent();

        if !was_feedback_sent {
            self.feedback_survey_notifier
                .write()
                .await
                .replace(WaitForComplition::new());
            self.shutdown_sequence
                .write()
                .await
                .push(ShutdownStep::FeedbackSurvey);
        }

        self.shutdown_sequence
            .write()
            .await
            .push(ShutdownStep::Exit);

        log::info!(target: LOG_TARGET, "Initialized shutdown sequence: {:?}", *self.shutdown_sequence.read().await);

        self.execute_shutdown_sequence().await;
    }

    pub async fn initialize_shutdown_from_close_button(&self) {
        // Prevent re-initialization if already in shutdown sequence
        if !self.shutdown_sequence.read().await.is_empty() {
            return;
        }

        let was_feedback_survey_sent = ConfigUI::content().await.was_feedback_sent();
        let was_shutdown_dialog_shown = *ConfigUI::content().await.shutdown_mode_selected();
        let selected_shutdown_mode = *ConfigCore::content().await.shutdown_mode();

        if !was_shutdown_dialog_shown {
            self.shudown_selection_notifier
                .write()
                .await
                .replace(WaitForComplition::new());
            self.shutdown_sequence
                .write()
                .await
                .push(ShutdownStep::ShutdownModeSelection);
        } else if selected_shutdown_mode == ShutdownMode::Tasktray {
            self.tasktray_shutdown_notifier
                .write()
                .await
                .replace(WaitForComplition::new());
            self.shutdown_sequence
                .write()
                .await
                .push(ShutdownStep::TaskTrayTriggeredShutdown);
        } else {
            // Direct shutdown, no need to wait for tasktray action
        }

        if !was_feedback_survey_sent {
            self.feedback_survey_notifier
                .write()
                .await
                .replace(WaitForComplition::new());
            self.shutdown_sequence
                .write()
                .await
                .push(ShutdownStep::FeedbackSurvey);
        }

        self.shutdown_sequence
            .write()
            .await
            .push(ShutdownStep::Exit);

        log::info!(target: LOG_TARGET, "Initialized shutdown sequence: {:?}", *self.shutdown_sequence.read().await);

        self.execute_shutdown_sequence().await;
    }

    async fn execute_shutdown_sequence(&self) {
        spawn(async move {
            loop {
                if INSTANCE.shutdown_sequence.read().await.is_empty() {
                    break;
                }
                INSTANCE.execute_shutdown_step().await;
            }
        });
    }

    async fn execute_shutdown_step(&self) {
        let mut sequence = self.shutdown_sequence.write().await;
        let execution_step = if sequence.is_empty() {
            None
        } else {
            Some(sequence.remove(0))
        };

        if let Some(step) = &execution_step {
            match step {
                ShutdownStep::ShutdownModeSelection => {
                    self.handle_shutdown_mode_selection().await;
                }
                ShutdownStep::FeedbackSurvey => {
                    self.handle_feedback_survey().await;
                }
                ShutdownStep::TaskTrayTriggeredShutdown => {
                    self.handle_tasktray_triggered_shutdown().await;
                }
                ShutdownStep::Exit => {
                    self.exit().await;
                }
            }
        }
    }

    // ================ Handlers for each shutdown step ================= //

    async fn handle_shutdown_mode_selection(&self) {
        EventsEmitter::emit_shutdown_mode_selection_requested().await;
        if let Some(notifier) = &*self.shudown_selection_notifier.read().await {
            let _ = notifier.wait_for_completion().await;
        }

        // if ShutdownMode is Tasktray, add TasktrayTriggeredShutdown step if not already present in the sequence
        if ConfigCore::content().await.shutdown_mode() == &ShutdownMode::Tasktray
            && self
                .shutdown_sequence
                .read()
                .await
                .iter()
                .all(|step| *step != ShutdownStep::TaskTrayTriggeredShutdown)
        {
            self.tasktray_shutdown_notifier
                .write()
                .await
                .replace(WaitForComplition::new());
            self.shutdown_sequence
                .write()
                .await
                .insert(0, ShutdownStep::TaskTrayTriggeredShutdown);
        }
    }

    async fn handle_feedback_survey(&self) {
        EventsEmitter::emit_feedback_requested().await;
        if let Some(notifier) = &*self.feedback_survey_notifier.read().await {
            let _ = notifier.wait_for_completion().await;
        }
    }

    async fn handle_tasktray_triggered_shutdown(&self) {
        if let Some(app_handle) = &*self.app_handle.read().await {
            SystemTrayManager::hide_to_tray(app_handle.get_webview_window("main"));
            if let Some(notifier) = &*self.tasktray_shutdown_notifier.read().await {
                let _ = notifier.wait_for_completion().await;
            }
        }
    }

    async fn exit(&self) {
        info!(target: LOG_TARGET, "Exiting application");
        let app_handle = self.app_handle.read().await;
        if let Some(app) = &*app_handle {
            EventsEmitter::emit_shutting_down().await;

            let _unused = GpuManager::write().await.stop_mining().await;
            let _unused = CpuManager::write().await.stop_mining().await;

            TasksTrackers::current().stop_all_processes().await;
            GpuManager::read().await.on_app_exit().await;
            CpuManager::read().await.on_app_exit().await;

            let state = app.state::<UniverseAppState>();

            state.tor_manager.on_app_exit().await;
            state.wallet_manager.on_app_exit().await;
            state.node_manager.on_app_exit().await;

            app.exit(0);
        }
    }

    // ================= Notification methods for each step completion ================= //

    pub async fn mark_shutdown_mode_selection_as_completed(&self) {
        if let Some(notifier) = &*self.shudown_selection_notifier.read().await {
            notifier.set_as_complete();
        }
    }

    pub async fn mark_feedback_survey_as_completed(&self) {
        if let Some(notifier) = &*self.feedback_survey_notifier.read().await {
            notifier.set_as_complete();
        }
    }

    pub async fn mark_tasktray_shutdown_as_completed(&self) {
        if let Some(notifier) = &*self.tasktray_shutdown_notifier.read().await {
            notifier.set_as_complete();
        }
    }

    pub fn instance() -> &'static ShutdownManager {
        &INSTANCE
    }
}
