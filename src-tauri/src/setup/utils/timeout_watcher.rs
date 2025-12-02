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

use crate::LOG_TARGET_APP_LOGIC;

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
                }
                _ = conditional_sleeper(self.timeout_duration) => {
                    // If the timeout duration has elapsed, we can exit the loop
                    info!(target: LOG_TARGET_APP_LOGIC, "Timeout watcher has resolved the timeout.");
                    return Some(());
                }
                // _ = self.count_sleep_duration(self.timeout_duration) => {
                //     return Some(());
                // }
            }
        }
    }

    /// Counts down the sleep duration, logging the remaining time at each second.  
    /// Use for debugging purposes to see how much time is left before the timeout is resolved.
    #[allow(dead_code)]
    async fn count_sleep_duration(
        &self,
        initial_duration: Option<Duration>,
    ) -> Result<(), anyhow::Error> {
        if initial_duration.is_none() {
            info!(target: LOG_TARGET_APP_LOGIC, "Timeout watcher is set to wait indefinitely.");
            // If the duration is None, we will wait indefinitely
            pending::<()>().await;
            return Ok(());
        }

        let mut duration = initial_duration.expect("Timeout duration should be set");
        loop {
            if duration.is_zero() {
                info!(target: LOG_TARGET_APP_LOGIC, "Timeout watcher has resolved the timeout.");
                return Ok(()); // The timeout has been resolved
            }

            let sleep_duration = std::cmp::min(duration, Duration::from_secs(1));
            info!(target: LOG_TARGET_APP_LOGIC, "Remaining timeout duration: {duration:?}");
            tokio::time::sleep(sleep_duration).await;
            duration -= sleep_duration;
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
                        return Ok(()); // The timeout has been reset
                    }
                    // If the hash value has not changed, we continue waiting
                    continue;
                }
                Err(_) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Timeout watcher receiver has been closed.");
                    return Err(anyhow::anyhow!("Timeout watcher receiver has been closed."));
                }
            }
        }
    }
}
