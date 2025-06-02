use crate::{events::CriticalProblemPayload, setup::trait_setup_phase::SetupPhaseImpl, EventsEmitter};
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
