use std::{path::PathBuf, sync::Arc};

use anyhow::Error;
use tauri::{AppHandle, Manager};

use crate::progress_trackers::progress_stepper::ProgressStepper;

pub trait SetupPhaseImpl<T> {
    type Configuration: Clone + Default;

    fn new() -> Self;
    fn create_progress_stepper() -> ProgressStepper;
    async fn load_configuration(&mut self, configuration: Self::Configuration)
        -> Result<(), Error>;
    async fn setup(self: Arc<Self>, app_handle: AppHandle);
    async fn setup_inner(&self, app_handle: AppHandle) -> Result<Option<T>, Error>;
    async fn finalize_setup(&self, app_handle: AppHandle, payload: Option<T>) -> Result<(), Error>;
    fn get_app_dirs(&self, app_handle: &AppHandle) -> Result<(PathBuf, PathBuf, PathBuf), Error> {
        let data_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Could not get data dir");
        let config_dir = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");
        let log_dir = app_handle
            .path()
            .app_log_dir()
            .expect("Could not get log dir");

        Ok((data_dir, config_dir, log_dir))
    }
}
