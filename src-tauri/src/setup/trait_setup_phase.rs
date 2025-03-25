use anyhow::Error;
use tauri::AppHandle;

use crate::progress_trackers::progress_tracker::ProgressPlanExecutor;
pub trait SetupPhaseImpl {
    type Configuration: Clone + Default;

    fn new() -> Self;
    fn create_progress_tracker() -> ProgressPlanExecutor;
    async fn load_configuration(&mut self, configuration: Self::Configuration)
        -> Result<(), Error>;
    async fn setup(&self, app_handle: AppHandle) -> Result<(), Error>;
    fn finalize_setup(&self, app_handle: AppHandle) -> Result<(), Error>;
}
