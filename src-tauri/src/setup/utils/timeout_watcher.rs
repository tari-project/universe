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

/// A utility function to compute a hash value for a given value of type T.  
/// This function uses the `DefaultHasher` to create a hash of the value.
pub fn hash_value<T: Hash>(value: &T) -> u64 {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    hasher.finish()
}

/// A utility function that sleeps for a specified duration if provided, or indefinitely if `None`.
/// If a duration is provided, it will sleep for that duration and return `Some(())`.
/// If `None` is provided, it will wait indefinitely, allowing the caller to use it in a `select!` block.
/// This is useful for implementing dynamic timeouts
/// # Example usage:
/// ```rust
/// tokio::select! {
///    _ = conditional_sleeper(Some(Duration::from_secs(5))) => {
///        println!("Slept for 5 seconds");
///   }
///   _ = some_other_future_that_needs_timeout => {
///       println!("Some other future completed");
///  }
/// }
///
/// tokio::select! {
///    _ = conditional_sleeper(None) => {
///       println!("Waiting indefinitely");
///   }
///   _ = some_other_future_that_dont_need_timeout => {
///      println!("Some other future completed");
///   }
/// }
/// ```
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

pub struct TimeoutWatcher {
    sender: Sender<u64>,
    timeout_duration: Option<Duration>,
    last_hash_value: Mutex<Option<u64>>,
}

impl TimeoutWatcher {
    pub fn new(timeout_duration: Option<Duration>) -> Self {
        Self {
            sender: Sender::default(),
            timeout_duration,
            last_hash_value: Mutex::new(None),
        }
    }
    /// Returns a clone of the sender used to notify about changes in the hash value.
    /// # Example usage:
    /// ```rust
    /// use std::hash::Hash;
    ///
    /// #[derive(Hash)]
    /// struct MyData {
    ///     value: String,
    ///     some_field: String,  
    /// }
    ///
    /// let timeout_watcher = TimeoutWatcher::new(Some(Duration::from_secs(60)));
    /// let sender = timeout_watcher.get_sender();
    /// let my_data = MyData {
    ///     value: "example".to_string(),
    ///    some_field: "field".to_string(),
    /// };
    ///
    ///let _unused = sender.send(hash_value(&my_data)).expect("Failed to send hash value");
    ///```
    pub fn get_sender(&self) -> Sender<u64> {
        self.sender.clone()
    }
    /// Resolves the timeout by waiting for either different hash value on the channel or the timeout duration to elapse.
    ///
    /// If the timeout duration is `None`, it will wait indefinitely. Its done on purpose to support usage with tokio's `select!` macro.
    /// # Example usage:
    /// ```rust
    /// tokio::select! {
    ///     _ = timeout_watcher.resolve_timeout() => {
    ///         println!("Timeout elapsed");
    ///    }
    ///     _ = some_other_future => {
    ///        println!("Some other future completed");
    ///    }
    /// }
    /// ```
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
