use anyhow::Error;
use tauri::AppHandle;

use crate::progress_trackers::progress_stepper::ProgressStepper;

pub trait SetupPhaseImpl {
    type Configuration: Clone + Default;

    fn new() -> Self;
    fn create_progress_stepper() -> ProgressStepper;
    async fn load_configuration(&mut self, configuration: Self::Configuration)
        -> Result<(), Error>;
    async fn setup(&mut self, app_handle: AppHandle);
    async fn setup_inner(&mut self, app_handle: AppHandle) -> Result<(), Error>;
    fn finalize_setup(&self, app_handle: AppHandle) -> Result<(), Error>;
}
