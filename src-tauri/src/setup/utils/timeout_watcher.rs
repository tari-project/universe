use std::{
    future::pending,
    hash::{DefaultHasher, Hash, Hasher},
    time::Duration,
};

use log::info;
use tokio::{
    select,
    sync::{
        watch::{Receiver, Sender},
        Mutex,
    },
};

static LOG_TARGET: &str = "tari::universe::timeout_watcher";

pub fn hash_value<T: Hash>(value: &T) -> u64 {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    hasher.finish()
}

// #[derive(Clone)]
pub struct TimeoutWatcher {
    sender: Sender<u64>,
    timeout_duration: Option<Duration>,
    last_hash_value: Mutex<Option<u64>>,
}

pub async fn conditional_sleeper(duration: Option<Duration>) -> Option<()> {
    match duration {
        Some(duration) => {
            tokio::time::sleep(duration).await;
            Some(())
        }
        None => {
            pending::<()>().await;
            None
        }
    }
}

impl TimeoutWatcher {
    pub fn new(timeout_duration: Option<Duration>) -> Self {
        Self {
            sender: Sender::default(),
            timeout_duration,
            last_hash_value: Mutex::new(None),
        }
    }
    pub fn get_sender(&self) -> Sender<u64> {
        self.sender.clone()
    }
    pub async fn resolve_timeout(&self) -> Option<()> {
        let mut receiver: Receiver<u64> = self.sender.subscribe();
        loop {
            select! {
                _ = self.resolve_when_hash_changed(&mut receiver) => {
                    info!(target: LOG_TARGET, "Timeout watcher received a signal to restart timeout.");
                }
                _ = conditional_sleeper(self.timeout_duration) => {
                    // If the timeout duration has elapsed, we can exit the loop
                    info!(target: LOG_TARGET, "Timeout watcher has resolved the timeout.");
                    return Some(());
                }
            }
        }
    }

    async fn resolve_when_hash_changed(
        &self,
        receiver: &mut Receiver<u64>,
    ) -> Result<(), anyhow::Error> {
        let mut last_hash_value = *self.last_hash_value.lock().await;
        loop {
            match receiver.changed().await {
                Ok(_) => {
                    let new_hash_value = *receiver.borrow();
                    if last_hash_value.ne(&Some(new_hash_value)) {
                        last_hash_value = Some(new_hash_value);
                        *self.last_hash_value.lock().await = last_hash_value;
                        info!(target: LOG_TARGET, "Timeout watcher received a signal to restart timeout.");
                        return Ok(()); // The timeout has been reset
                    }
                    // If the hash value has not changed, we continue waiting
                    continue;
                }
                Err(_) => {
                    info!(target: LOG_TARGET, "Timeout watcher receiver has been closed.");
                    return Err(anyhow::anyhow!("Timeout watcher receiver has been closed."));
                }
            }
        }
    }
}
