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
    LOG_TARGET_APP_LOGIC,
    setup::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl},
};
use log::{info, warn};
use tokio::select;

pub struct SetupDefaultAdapter {}

impl SetupDefaultAdapter {
    pub async fn setup<T: SetupPhaseImpl + Send + Sync + 'static>(phase: T) {
        info!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Starting setup", phase.get_phase_id());
        let mut shutdown_signal = phase.get_shutdown_signal().await;
        phase.get_task_tracker().await.spawn(async move {
            for subscriber in &mut phase.get_phase_dependencies().iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        phase.get_status_sender().send(PhaseStatus::Cancelled).unwrap_or_else(|_| {
                            warn!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Failed to send status: {}", phase.get_phase_id(), PhaseStatus::Cancelled);
                        });
                        return;
                    }
                }
            };

            tokio::select! {
                _ = phase.get_timeout_watcher().resolve_timeout() => {
                    let error_message = format!("[ {} Phase ] Setup timed out", phase.get_phase_id());
                    phase.get_status_sender().send(PhaseStatus::Failed(error_message.clone())).unwrap_or_else(|_| {
                        warn!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Failed to send status: {}", phase.get_phase_id(), PhaseStatus::Failed(error_message));
                    });

                }
                result = phase.setup_inner() => {
                    if result.is_ok() {
                        info!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Setup completed successfully", phase.get_phase_id());
                        let _unused = phase.finalize_setup().await;
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Setup cancelled", phase.get_phase_id());
                }
            };

            info!(target: LOG_TARGET_APP_LOGIC, "[ {} Phase ] Setup task finished", phase.get_phase_id());
        });
    }
}
