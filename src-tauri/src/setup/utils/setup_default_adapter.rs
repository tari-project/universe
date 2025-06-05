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

use crate::{
    events::CriticalProblemPayload, setup::trait_setup_phase::SetupPhaseImpl, EventsEmitter,
};
use log::{error, info, warn};
use tauri_plugin_sentry::sentry;
use tokio::select;

static LOG_TARGET: &str = "tari::universe::setup_default_adapter";

pub struct SetupDefaultAdapter {}

impl SetupDefaultAdapter {
    pub async fn setup<T: SetupPhaseImpl + Send + Sync + 'static>(
        phase: T,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", phase.get_phase_id());
        let mut shutdown_signal = phase.get_shutdown_signal().await;
        phase.get_task_tracker().await.spawn(async move {
            for subscriber in &mut phase.get_phase_dependencies().iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", phase.get_phase_id());
                        return;
                    }
                }
            };

            tokio::select! {
                _ = phase.get_timeout_watcher().resolve_timeout() => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", phase.get_phase_id());
                    let error_message = format!("[ {} Phase ] Setup timed out", phase.get_phase_id());
                    sentry::capture_message(&error_message, sentry::Level::Error);
                    EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                        title: Some(phase.get_phase_id().get_critical_problem_title()),
                        description: Some(phase.get_phase_id().get_critical_problem_description()),
                        error_message: Some(error_message),
                    }).await;

                }
                result = phase.setup_inner() => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", phase.get_phase_id());
                            let _unused = phase.finalize_setup().await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", phase.get_phase_id(),error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", phase.get_phase_id(),error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                                title: Some(phase.get_phase_id().get_critical_problem_title()),
                                description: Some(phase.get_phase_id().get_critical_problem_description()),
                                error_message: Some(error_message),
                            }).await;
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", phase.get_phase_id());
                }
            };

        });

        Ok(())
    }
}
