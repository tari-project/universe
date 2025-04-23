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

use std::{path::PathBuf, time::Duration};

use anyhow::Error;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::watch::{Receiver, Sender};
use tokio_util::task::TaskTracker;

use crate::progress_trackers::ProgressStepper;

use super::setup_manager::{PhaseStatus, SetupPhase};

#[derive(Clone)]
pub struct SetupConfiguration {
    pub listeners_for_required_phases_statuses: Vec<Receiver<PhaseStatus>>,
    pub setup_timeout_duration: Option<Duration>,
    pub soft_retires: Option<u8>,
    pub hard_retires: Option<u8>,
}

pub trait SetupPhaseImpl {
    type AppConfiguration: Clone + Default;
    type SetupOutput: Clone + Default + Send + Sync;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
    ) -> Self;
    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper;
    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error>;
    async fn setup(self);
    fn setup_inner(
        &self,
    ) -> impl std::future::Future<Output = Result<Option<Self::SetupOutput>, Error>> + std::marker::Send;
    fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        payload: Option<Self::SetupOutput>,
    ) -> impl std::future::Future<Output = Result<(), Error>> + std::marker::Send;
    fn get_app_handle(&self) -> &AppHandle;
    async fn get_task_tracker(&self) -> TaskTracker;
    async fn get_shutdown_signal(&self) -> ShutdownSignal;
    fn get_phase_name(&self) -> SetupPhase;
    fn get_status_sender(&self) -> Sender<PhaseStatus>;
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>>;
    fn get_max_soft_restarts(&self) -> u8;
    fn get_timeout_duration(&self) -> Duration;
    fn get_max_hard_restarts(&self) -> u8;
    fn get_sum_of_restarts(&self) -> u8 {
        self.get_max_soft_restarts() + self.get_max_hard_restarts()
    }
    fn hard_reset(
        &self,
    ) -> impl std::future::Future<Output = Result<(), Error>> + std::marker::Send;
    fn get_app_dirs(&self) -> Result<(PathBuf, PathBuf, PathBuf), Error> {
        let data_dir = self
            .get_app_handle()
            .path()
            .app_local_data_dir()
            .expect("Could not get data dir");
        let config_dir = self
            .get_app_handle()
            .path()
            .app_config_dir()
            .expect("Could not get config dir");
        let log_dir = self
            .get_app_handle()
            .path()
            .app_log_dir()
            .expect("Could not get log dir");

        Ok((data_dir, config_dir, log_dir))
    }
}
