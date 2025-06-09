use std::{sync::LazyLock, time::Duration};

use tokio::{sync::{watch::Receiver, Mutex},time::sleep};

use crate::{
    events::ConnectionStatusPayload, setup::setup_manager::{PhaseStatus, SetupPhase}, tasks_tracker::TasksTrackers, EventsEmitter
};

use log::{info};

use super::{
    trait_listener::{
        UnlockConditionsListenerTrait, UnlockConditionsStatusChannels, UnlockStrategyTrait,
    }, SetupFeature, SetupFeaturesList
};

static LOG_TARGET: &str = "tari::universe::unlock_conditions::listener_setup_finished";
static INSTANCE: LazyLock<ListenerSetupFinished> = LazyLock::new(|| ListenerSetupFinished::new());

pub struct ListenerSetupFinished {
    listener: Mutex<Option<tokio::task::JoinHandle<()>>>,
    status_channels: Mutex<UnlockConditionsStatusChannels>,
    features_list: Mutex<SetupFeaturesList>,
}

impl UnlockConditionsListenerTrait for ListenerSetupFinished {
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
        let setup_finished_listener = ListenerSetupFinished::current();

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
                        setup_finished_listener.conditions_met_callback().await;
                        break;
                    } else {
                        info!(target: LOG_TARGET, "Conditions not met, waiting for next check");
                    }
                    
                    sleep(Duration::from_secs(5)).await;
                }
            });

        *self.listener.lock().await = Some(listener_task);
    }

    async fn handle_restart(&self) {}
    async fn conditions_met_callback(&self) {
        let setup_features = self.features_list.lock().await.clone();
        if setup_features.is_feature_enabled(SetupFeature::Restarting) {
            info!(target: LOG_TARGET, "App Restarted");
            EventsEmitter::emit_connection_status_changed(ConnectionStatusPayload::Succeed).await;
        }else {
            EventsEmitter::emit_initial_setup_finished().await;
        }
    }

    async fn load_setup_features(&self, features: SetupFeaturesList) {
        *self.features_list.lock().await = features;
    }
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync> {
        Box::new(DefaultStrategy)
    }
}


struct DefaultStrategy;
impl UnlockStrategyTrait for DefaultStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![
            SetupPhase::Core,
            SetupPhase::Hardware,
            SetupPhase::Node,
            SetupPhase::Wallet,
            SetupPhase::Unknown,
        ]
    }
}