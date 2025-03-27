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

use std::{collections::HashMap, sync::Arc};

use log::{error, info};
use tauri::AppHandle;
use tokio::sync::{watch::Sender, RwLock};

const LOG_TARGET: &str = "tari::universe::progress_tracker";

pub struct ProgressTracker {
    inner: Arc<RwLock<ProgressTrackerInner>>,
}

impl Clone for ProgressTracker {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl ProgressTracker {
    pub fn new(app_handle: AppHandle, channel: Option<Sender<String>>) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ProgressTrackerInner::new(app_handle, channel))),
        }
    }

    pub async fn set_max(&self, max: u64) {
        self.inner.write().await.set_next_max(max);
    }

    pub async fn send_last_action(&self, action: String) {
        self.inner.read().await.send_last_action(action);
    }

    pub async fn update(
        &self,
        title: String,
        title_params: Option<HashMap<String, String>>,
        progress: u64,
    ) {
        self.inner
            .read()
            .await
            .update(title, title_params, progress)
            .await;
    }
}

pub struct ProgressTrackerInner {
    _app_handle: AppHandle,
    min: u64,
    next_max: u64,
    last_action_channel: Option<Sender<String>>,
}

impl ProgressTrackerInner {
    pub fn new(app_handle: AppHandle, channel: Option<Sender<String>>) -> Self {
        Self {
            _app_handle: app_handle.clone(),
            min: 0,
            next_max: 0,
            last_action_channel: channel,
        }
    }

    pub fn set_next_max(&mut self, max: u64) {
        self.min = self.next_max;
        self.next_max = max;
    }

    pub fn send_last_action(&self, action: String) {
        if let Some(channel) = &self.last_action_channel {
            channel
                .send(action)
                .inspect_err(|e| error!(target: LOG_TARGET, "Could not send last action: {:?}", e))
                .ok();
        }
    }

    pub async fn update(
        &self,
        title: String,
        title_params: Option<HashMap<String, String>>,
        progress: u64,
    ) {
        info!(target: LOG_TARGET, "Progress: {}% {}", progress, title);
        info!(target: LOG_TARGET, "Params: {:?}", title_params);
        let progress_percentage = (self.min as f64
            + (((self.next_max - self.min) as f64) * ((progress as f64) / 100.0)))
            / 100.0;
        if let Some(channel) = &self.last_action_channel {
            channel
                .send(format!(
                    "last action: {} at progress: {}",
                    title.clone(),
                    progress_percentage
                ))
                .inspect_err(|e| error!(target: LOG_TARGET, "Could not send last action: {:?}", e))
                .ok();
        }
    }
}
