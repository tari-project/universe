
use std::{sync::LazyLock, time::Duration};

use tauri::AppHandle;
use tokio::{sync::{watch::Receiver, Mutex},time::sleep};

use crate::{
    setup::setup_manager::{PhaseStatus, SetupPhase}, tasks_tracker::TasksTrackers, EventsEmitter
};

use log::info;

use super::{
    trait_listener::{
        UnlockConditionsListenerTrait, UnlockConditionsStatusChannels, UnlockStrategyTrait,
    },  SetupFeaturesList
};

static LOG_TARGET: &str = "tari::universe::unlock_conditions::listener_unlock_gpu_mining";
static INSTANCE: LazyLock<ListenerUnlockGpuMining> = LazyLock::new(|| ListenerUnlockGpuMining::new());

pub struct ListenerUnlockGpuMining {
    listener: Mutex<Option<tokio::task::JoinHandle<()>>>,
    status_channels: Mutex<UnlockConditionsStatusChannels>,
    features_list: Mutex<SetupFeaturesList>,
}

impl UnlockConditionsListenerTrait for ListenerUnlockGpuMining {
    fn new() -> Self {
        Self {
            listener: Mutex::new(None),
            status_channels: Mutex::new(UnlockConditionsStatusChannels::new()),
            features_list: Mutex::new(SetupFeaturesList::default()),
        }
    }

    fn current() -> &'static Self {
        &INSTANCE
    }

    async fn add_status_channel(&self, key: SetupPhase, value: Receiver<PhaseStatus>) {
        let mut channels = self.status_channels.lock().await;
        channels.insert(key, value);
    }

async fn stop_listener(&self) {
        if let Some(listener_task) = self.listener.lock().await.take() {
            info!(target: LOG_TARGET, "Stopping listener task");
            listener_task.abort();
        } else {
            info!(target: LOG_TARGET, "No listener task to stop");
        }
    
}

    async fn start_listener(&self) {
        self.stop_listener().await;
        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let unlock_strategy = self.select_unlock_strategy().await;
        let channels = self.status_channels.lock().await.clone();

        if !unlock_strategy.are_all_channels_loaded(&channels){
            info!(target: LOG_TARGET, "Not all listeners are ready, skipping listener start");
            return;
        }
        if !unlock_strategy.is_any_phase_restarting(channels.clone()) {
            info!(target: LOG_TARGET, "All phases are marked as completed, no need to start listener");
            return;
        }

        let unlock_gpu_mining_listener = ListenerUnlockGpuMining::current();

        let listener_task = TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                if shutdown_signal.is_triggered() {
                    info!(target: LOG_TARGET, "Shutdown signal already triggered, stopping listener");
                    return;
                }

                loop {
                    if unlock_strategy.check_conditions(&channels).unwrap_or(false) {
                        info!(target: LOG_TARGET, "Conditions met, proceeding with unlock");
                        unlock_gpu_mining_listener.conditions_met_callback().await;
                        break;
                    } else {
                        info!(target: LOG_TARGET, "Conditions not met, waiting for next check");
                    }
                    
                    sleep(Duration::from_secs(5)).await;
                }
            });

        *self.listener.lock().await = Some(listener_task);
    }
    async fn conditions_met_callback(&self) {
        info!(target: LOG_TARGET, "Unlocking Mining");
        EventsEmitter::emit_unlock_gpu_mining().await;
    }

    async fn handle_restart(&self) {
        let unlock_strategy = self.select_unlock_strategy().await;
        let channels = self.status_channels.lock().await.clone();

        let is_any_phase_restarting = unlock_strategy.is_any_phase_restarting(channels.clone());
        if is_any_phase_restarting {
            self.lock().await;
        }
    }

    async fn load_setup_features(&self, features: SetupFeaturesList) {
        *self.features_list.lock().await = features;
    }
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync> {
        Box::new(DefaultStrategy)
    }
}

impl ListenerUnlockGpuMining {
    async fn lock(&self) {
        info!(target: LOG_TARGET, "Locking Mining");
        EventsEmitter::emit_lock_gpu_mining().await;
    }
}


struct DefaultStrategy;
impl UnlockStrategyTrait for DefaultStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![
            SetupPhase::Core,
            SetupPhase::Hardware,
            SetupPhase::Node,
            SetupPhase::Unknown,
        ]
    }
}