use crate::{events_manager::EventsManager, setup::trait_setup_phase::SetupPhaseImpl};
use log::{error, info, warn};
use tauri_plugin_sentry::sentry;
use tokio::select;

static LOG_TARGET: &str = "tari::universe::setup_default_adapter";

pub struct SetupDefaultAdapter {}

impl SetupDefaultAdapter {
    pub async fn setup<T: SetupPhaseImpl + Send + Sync + 'static>(
        phase: T,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", phase.get_phase_name());
        let mut shutdown_signal = phase.get_shutdown_signal().await;
        phase.get_task_tracker().await.spawn(async move {
            for subscriber in &mut phase.get_phase_dependencies().iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", phase.get_phase_name());
                        return;
                    }
                }
            };
            let mut restart_counter: u8 = 0;
            let max_restarts = phase.get_sum_of_restarts();
            while restart_counter < max_restarts {
                
            if restart_counter.eq(&phase.get_max_soft_restarts()) && restart_counter.gt(&0) {
                info!(target: LOG_TARGET, "[ {} Phase ] All soft restart attempts failed", phase.get_phase_name());
                info!(target: LOG_TARGET, "[ {} Phase ] Executing hard restart", phase.get_phase_name());
                if let Err(e) = phase.hard_reset().await {
                    error!(target: LOG_TARGET, "[ {} Phase ] Hard reset failed: {:?}", phase.get_phase_name(), e);
                    let error_message = format!("[ {} Phase ] Hard reset failed: {:?}", phase.get_phase_name(), e);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
            }
                
                
            let setup_timeout = tokio::time::sleep(phase.get_timeout_duration());
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", phase.get_phase_name());
                    let error_message = format!("[ {} Phase ] Setup timed out", phase.get_phase_name());
                    sentry::capture_message(&error_message, sentry::Level::Error);
                    break;

                }
                result = phase.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", phase.get_phase_name());
                            let _unused = phase.finalize_setup(phase.get_status_sender().clone(),payload).await;
                            break;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", phase.get_phase_name(),error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", phase.get_phase_name(),error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", phase.get_phase_name());
                    break;
                }
            };

            restart_counter += 1;
            info!(target: LOG_TARGET, "[ {} Phase ] Restarting setup process | attempt: {} / {}", phase.get_phase_name(), restart_counter, phase.get_max_soft_restarts());
            }

            if restart_counter.eq(&max_restarts) {
                error!(target: LOG_TARGET, "[ {} Phase ] Setup failed after {} attempts", phase.get_phase_name(), max_restarts);
                let error_message = format!("[ {} Phase ] Setup failed after {} attempts", phase.get_phase_name(), max_restarts);
                sentry::capture_message(&error_message, sentry::Level::Error);
                EventsManager::handle_critical_problem(phase.get_app_handle(), Some(phase.get_phase_name().get_critical_problem_title()), Some(phase.get_phase_name().get_critical_problem_description()))
                    .await;
            }

        });

        Ok(())
    }
}
