pub mod phase_builder;
pub mod setup_handler;
// use log::{error, info, warn};
// use std::sync::Arc;
// use tauri_plugin_sentry::sentry;
// use tokio::sync::watch::{Receiver, Sender};

// use crate::events_manager::EventsManager;

// use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

// static LOG_TARGET: &str = "tari::universe::setup_utils";

// pub async fn default_setup<T>(
//     manager: Arc<T>,
//     status_sender: Sender<PhaseStatus>,
//     mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
// ) where
//     T: SetupPhaseImpl + Send + Sync + 'static,
// {
//     info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", manager.get_phase_name());
//     let mut shutdown_signal = manager.get_task_tracker_util().get_signal().await;
//     let task_tracker = manager.get_task_tracker_util().get_task_tracker().await;
//     let setup_timeout = tokio::time::sleep(manager.get_timeout_duration());

//     task_tracker.spawn(async move {
//         for subscriber in &mut flow_subscribers.iter_mut() {
//             tokio::select! {
//                 _ = subscriber.wait_for(|value| value.is_success()) => {}
//                 _ = shutdown_signal.wait() => {
//                     warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", manager.get_phase_name());
//                 }
//             };
//         };
//         tokio::select! {
//             _ = setup_timeout => {
//                 error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", manager.get_phase_name());
//                 let error_message = format!("[ {} Phase ] Setup timed out", manager.get_phase_name());
//                 sentry::capture_message(&error_message, sentry::Level::Error);
//                 EventsManager::handle_critical_problem(manager.get_app_handle(), Some(manager.get_phase_name().get_critical_problem_title()), Some(manager.get_phase_name().get_critical_problem_description()))
//                     .await;

//             }
//             result = manager.setup_inner() => {
//                 match result {
//                     Ok(payload) => {
//                         info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", manager.get_phase_name());
//                         let _unused = manager.finalize_setup(status_sender,payload).await;
//                     }
//                     Err(error) => {
//                         error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", manager.get_phase_name(),error);
//                         let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", manager.get_phase_name(),error);
//                         sentry::capture_message(&error_message, sentry::Level::Error);
//                         EventsManager::handle_critical_problem(manager.get_app_handle(), Some(manager.get_phase_name().get_critical_problem_title()), Some(manager.get_phase_name().get_critical_problem_description()))
//                             .await;
//                     }
//                 }
//             }
//             _ = shutdown_signal.wait() => {
//                 warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", manager.get_phase_name());
//             }
//         };

//     });

// TasksTrackers::current().core_phase.get_task_tracker().await.spawn(async move {
//     let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
//     let mut shutdown_signal = TasksTrackers::current().core_phase.get_signal().await;
//     for subscriber in &mut flow_subscribers.iter_mut() {
//         select! {
//             _ = subscriber.wait_for(|value| value.is_success()) => {}
//             _ = shutdown_signal.wait() => {
//                 warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
//                 return;
//             }
//         }
//     };
//     tokio::select! {
//         _ = setup_timeout => {
//             error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Core);
//             let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Core);
//             sentry::capture_message(&error_message, sentry::Level::Error);
//             EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Core.get_critical_problem_title()), Some(SetupPhase::Core.get_critical_problem_description()))
//                 .await;

//         }
//         result = self.setup_inner() => {
//             match result {
//                 Ok(payload) => {
//                     info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Core);
//                     let _unused = self.finalize_setup(status_sender,payload).await;
//                 }
//                 Err(error) => {
//                     error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
//                     let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
//                     sentry::capture_message(&error_message, sentry::Level::Error);
//                     EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Core.get_critical_problem_title()), Some(SetupPhase::Core.get_critical_problem_description()))
//                         .await;
//                 }
//             }
//         }
//         _ = shutdown_signal.wait() => {
//             warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
//         }
//     };
// });
// }
