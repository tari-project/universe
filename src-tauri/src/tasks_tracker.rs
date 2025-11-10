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
use std::sync::{Arc, LazyLock};
use tari_shutdown::{Shutdown, ShutdownSignal};
use tokio::sync::RwLock;
use tokio_util::task::TaskTracker;

use crate::LOG_TARGET_APP_LOGIC;

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
    pub async fn trigger_shutdown(&self) {
        info!(target: LOG_TARGET_APP_LOGIC, "Triggering shutdown for {} processes", self.name);
        self.shutdown.write().await.trigger();
    }

    pub async fn wait_for_clousure(&self) {
        info!(target: LOG_TARGET_APP_LOGIC, "Triggering task close for {} processes", self.name);
        self.task_tracker.read().await.close();
        info!(target: LOG_TARGET_APP_LOGIC, "Waiting for {} processes to finish | number of tasks: {}", self.name, self.task_tracker.read().await.len());
        self.task_tracker.read().await.wait().await;
        info!(target: LOG_TARGET_APP_LOGIC, "{} processes have finished", self.name);
    }

    pub async fn close(&self) {
        self.trigger_shutdown().await;
        self.wait_for_clousure().await;
    }

    pub async fn replace(&self) {
        *self.shutdown.write().await = Shutdown::new();
        *self.task_tracker.write().await = TaskTracker::new();
    }
}

pub struct TasksTrackers {
    pub wallet_phase: Arc<TaskTrackerUtil>,
    pub node_phase: Arc<TaskTrackerUtil>,
    pub cpu_mining_phase: Arc<TaskTrackerUtil>,
    pub gpu_mining_phase: Arc<TaskTrackerUtil>,
    pub core_phase: Arc<TaskTrackerUtil>,
    pub common: Arc<TaskTrackerUtil>,
}

impl TasksTrackers {
    fn new() -> Self {
        Self {
            wallet_phase: Arc::new(TaskTrackerUtil::new("Wallet phase")),
            node_phase: Arc::new(TaskTrackerUtil::new("Node phase")),
            cpu_mining_phase: Arc::new(TaskTrackerUtil::new("CPU Mining phase")),
            gpu_mining_phase: Arc::new(TaskTrackerUtil::new("GPU Mining phase")),
            core_phase: Arc::new(TaskTrackerUtil::new("Core phase")),
            common: Arc::new(TaskTrackerUtil::new("Common")),
        }
    }

    pub fn current() -> &'static TasksTrackers {
        &INSTANCE
    }

    pub async fn stop_all_processes(&self) {
        // Trigger shutdown for all phases
        self.common.trigger_shutdown().await;
        self.core_phase.trigger_shutdown().await;
        self.cpu_mining_phase.trigger_shutdown().await;
        self.gpu_mining_phase.trigger_shutdown().await;
        self.wallet_phase.trigger_shutdown().await;
        self.node_phase.trigger_shutdown().await;

        // Wait for all phases to finish
        self.common.wait_for_clousure().await;
        self.core_phase.wait_for_clousure().await;
        self.cpu_mining_phase.wait_for_clousure().await;
        self.gpu_mining_phase.wait_for_clousure().await;
        self.wallet_phase.wait_for_clousure().await;
        self.node_phase.wait_for_clousure().await;
    }
}
