use std::{sync::Arc, time::Duration};

use crate::{
    setup::setup_manager::{PhaseStatus, SetupPhase},
    tasks_tracker::TaskTrackerUtil,
};
use log::{error, info, warn};
use tari_shutdown::ShutdownSignal;
use tauri_plugin_sentry::sentry;
use tokio::sync::{
    watch::{Receiver, Sender},
    RwLock,
};

static LOG_TARGET: &str = "tari::universe::setup_builder";

#[derive(Default, Clone)]
pub struct SetupBuilderOptions {
    dependent_phases_stats_subcribers: Arc<RwLock<Vec<Receiver<PhaseStatus>>>>,
    timeout_duration: Option<Duration>,
    soft_restart_limit: Option<u32>,
    hard_restart_limit: Option<u32>,
}
#[derive(Default)]
pub struct SetupBuilderCallbacks {
    setup_inner_callback: Option<Box<dyn FnOnce() -> Result<(), anyhow::Error> + Send + Sync>>,
    setup_finalize_callback: Option<Box<dyn FnOnce() -> Result<(), anyhow::Error> + Send + Sync>>,
    hard_restart_callback: Option<Box<dyn FnOnce() -> Result<(), anyhow::Error> + Send + Sync>>,
}
pub struct SetupBuilder {
    options: SetupBuilderOptions,
}

impl SetupBuilder {
    pub async fn add_dependent_phases(
        &mut self,
        dependent_phases: Vec<Receiver<PhaseStatus>>,
    ) -> &mut Self {
        for phase in dependent_phases {
            self.options
                .dependent_phases_stats_subcribers
                .write()
                .await
                .push(phase);
        }
        self
    }

    pub async fn add_timeout(&mut self, timeout_duration: Duration) -> &mut Self {
        self.options.timeout_duration = Some(timeout_duration);
        self
    }

    pub async fn add_soft_restart_limit(&mut self, restart_limit: u32) -> &mut Self {
        self.options.soft_restart_limit = Some(restart_limit);
        self
    }

    pub async fn add_hard_restart_limit(&mut self, restart_limit: u32) -> &mut Self {
        self.options.hard_restart_limit = Some(restart_limit);
        self
    }

    pub fn build(
        &self,
        phase: SetupPhase,
        phase_status_sender: Sender<PhaseStatus>,
        task_tracker_util: TaskTrackerUtil,
    ) -> SetupCreator {
        SetupCreator::new(
            phase,
            phase_status_sender,
            task_tracker_util,
            Arc::new(self.options.clone()),
        )
    }
}

pub struct SetupCreator {
    phase: SetupPhase,
    phase_status_sender: Sender<PhaseStatus>,
    task_tracker_util: TaskTrackerUtil,
    options: Arc<SetupBuilderOptions>,
}

impl SetupCreator {
    pub fn new(
        phase: SetupPhase,
        phase_status_sender: Sender<PhaseStatus>,
        task_tracker_util: TaskTrackerUtil,
        options: Arc<SetupBuilderOptions>,
    ) -> Self {
        Self {
            phase,
            phase_status_sender,
            task_tracker_util,
            options,
        }
    }

    pub fn builder() -> SetupBuilder {
        SetupBuilder {
            options: SetupBuilderOptions::default(),
        }
    }

    pub async fn conditional_sleep_timeout(&self) -> Option<()> {
        match self.options.timeout_duration {
            Some(timeout) => Some(tokio::time::sleep(timeout).await),
            None => Some(()),
        }
    }

    pub async fn handle_wait_for_dependent_phases(&self, mut shutdown_signal: ShutdownSignal) {
        for subscriber in self
            .options
            .dependent_phases_stats_subcribers
            .write()
            .await
            .iter_mut()
        {
            tokio::select! {
                _ = subscriber.wait_for(|value| value.is_success()) => {}
                Some(_) = self.conditional_sleep_timeout() => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", self.phase);
                    let error_message = format!("[ {} Phase ] Setup timed out", self.phase);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", self.phase);
                }
            };
        }
    }

    pub async fn start_setup<T>(
        self: Arc<Self>,
        setup_callback: Option<T>,
        finalize_callback: Option<T>,
        restart_callback: Option<T>,
    ) where
        T: FnOnce() -> Result<(), anyhow::Error> + Send + Sync,
    {
        let phase = self.phase.clone();
        let mut shutdown_signal = self.task_tracker_util.get_signal().await;
        let task_tracker = self.task_tracker_util.get_task_tracker().await;

        // let option = self.options.clone();

        task_tracker.spawn(async move {
            let _unused = self.handle_wait_for_dependent_phases(shutdown_signal).await;
        });
    }
}
