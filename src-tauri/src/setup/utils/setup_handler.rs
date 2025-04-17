use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::sync::watch::Sender;

use crate::{
    setup::{setup_manager::PhaseStatus, trait_setup_phase::SetupConfiguration},
    tasks_tracker::TaskTrackerUtil,
};

// app_handle: AppHandle,
// progress_stepper: Mutex<ProgressStepper>,
// app_configuration: CoreSetupPhaseAppConfiguration,
// setup_configuration: SetupConfiguration,
// task_tracker_util: TaskTrackerUtil,
// status_sender: Sender<PhaseStatus>,

// pub async fn handle_setup(
//     app_handle: AppHandle,
//     status_sender: Sender<PhaseStatus>,
//     task_tracker_util: TaskTrackerUtil,
//     configuration: SetupConfiguration,
// ) {
// }

pub async fn wait_for_required_phases(
    shutdown_signal: ShutdownSignal,
    