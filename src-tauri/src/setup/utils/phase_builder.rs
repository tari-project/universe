use std::time::Duration;

use tauri::AppHandle;
use tokio::sync::watch::{Receiver, Sender};

use crate::setup::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
};

pub struct PhaseBuilder {
    configuration: SetupConfiguration,
}

impl PhaseBuilder {
    pub fn new() -> Self {
        PhaseBuilder {
            configuration: SetupConfiguration {
                listeners_for_required_phases_statuses: Vec::new(),
                setup_timeout_duration: None,
                soft_retires: None,
                hard_retires: None,
            },
        }
    }

    pub fn with_listeners_for_required_phases_statuses(
        mut self,
        listeners: Vec<Receiver<PhaseStatus>>,
    ) -> Self {
        self.configuration.listeners_for_required_phases_statuses = listeners;
        self
    }

    pub fn with_setup_timeout_duration(mut self, duration: Duration) -> Self {
        self.configuration.setup_timeout_duration = Some(duration);
        self
    }

    pub fn with_soft_retires(mut self, soft_retires: u8) -> Self {
        self.configuration.soft_retires = Some(soft_retires);
        self
    }

    pub fn with_hard_retires(mut self, hard_retires: u8) -> Self {
        self.configuration.hard_retires = Some(hard_retires);
        self
    }

    pub async fn build<T: SetupPhaseImpl>(
        &self,
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
    ) -> T {
        T::new(app_handle, status_sender, self.configuration.clone()).await
    }
}
