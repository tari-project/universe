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
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.use crate::UniverseAppState;

use log::info;
use std::sync::LazyLock;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tokio::sync::RwLock;
use tokio_util::task::TaskTracker;

static LOG_TARGET: &str = "tari::universe::tasks_tracker";
static INSTANCE: LazyLock<TasksTrackers> = LazyLock::new(TasksTrackers::new);

pub struct TaskTrackerUtil {
    name: &'static str,
    shutdown: RwLock<Shutdown>,
    task_tracker: RwLock<TaskTracker>,
}
impl TaskTrackerUtil {
    pub fn new(name: &'static str) -> Self {
        Self {
            name,
            shutdown: RwLock::new(Shutdown::new()),
            task_tracker: RwLock::new(TaskTracker::new()),
        }
    }

    pub async fn get_signal(&self) -> ShutdownSignal {
        self.shutdown.read().await.to_signal()
    }
    pub async fn get_task_tracker(&self) -> TaskTracker {
        self.task_tracker.read().await.clone()
    }
    pub async fn close(&self) {
        info!(target: LOG_TARGET, "Triggering shutdown for {} processes", self.name);
        self.shutdown.write().await.trigger();
        info!(target: LOG_TARGET, "Triggering task close for {} processes", self.name);
        self.task_tracker.read().await.close();
        info!(target: LOG_TARGET, "Waiting for {} processes to finish", self.name);
        self.task_tracker.read().await.wait().await;
        info!(target: LOG_TARGET, "{} processes have finished", self.name);
    }

    pub async fn replace(&self) {
        *self.shutdown.write().await = Shutdown::new();
        *self.task_tracker.write().await = TaskTracker::new();
    }
}

pub struct TasksTrackers {
    pub wallet_phase: TaskTrackerUtil,
    pub hardware_phase: TaskTrackerUtil,
    pub mining_phase: TaskTrackerUtil,
    pub node_phase: TaskTrackerUtil,
    pub core_phase: TaskTrackerUtil,
    pub common: TaskTrackerUtil,
}

impl TasksTrackers {
    fn new() -> Self {
        Self {
            wallet_phase: TaskTrackerUtil::new("Wallet phase"),
            hardware_phase: TaskTrackerUtil::new("Hardware phase"),
            mining_phase: TaskTrackerUtil::new("Mining phase"),
            node_phase: TaskTrackerUtil::new("Node phase"),
            core_phase: TaskTrackerUtil::new("Core phase"),
            common: TaskTrackerUtil::new("Common"),
        }
    }

    pub fn current() -> &'static TasksTrackers {
        &INSTANCE
    }

    pub async fn stop_all_processes(&self) {
        self.common.close().await;
        self.core_phase.close().await;
        self.wallet_phase.close().await;
        self.hardware_phase.close().await;
        self.mining_phase.close().await;
        self.node_phase.close().await;
    }
}
