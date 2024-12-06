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

use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};

#[derive(Debug)]
pub struct AutoRollback<T> {
    value: Arc<Mutex<T>>,
    initial_value: T,
}

impl<T> AutoRollback<T>
where
    T: Clone + Send + 'static,
{
    pub fn new(value: T) -> Self {
        AutoRollback {
            value: Arc::new(Mutex::new(value.clone())),
            initial_value: value,
        }
    }

    pub async fn set_value(&self, new_value: T, rollback_delay: Duration) {
        // Update the value
        {
            if let Ok(mut val) = self.value.lock() {
                *val = new_value;
            }
        }

        // Spawn a task that will rollback the value after the delay
        let value_clone = Arc::clone(&self.value);
        let initial_value = self.initial_value.clone();
        tokio::spawn(async move {
            sleep(rollback_delay).await;

            println!("Rollback finished after {:?}", rollback_delay);
            // Rollback to the initial value
            if let Ok(mut val) = value_clone.lock() {
                *val = initial_value;
            };
        });
    }

    pub fn get_value(&self) -> T
    where
        T: Clone,
    {
        if let Ok(val) = self.value.lock() {
            val.clone()
        } else {
            self.initial_value.clone()
        }
    }
}
