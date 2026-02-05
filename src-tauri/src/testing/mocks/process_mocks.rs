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

//! Mock implementations for process-related traits.

use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use tokio_util::task::TaskTracker;

use crate::process_adapter::{
    HandleUnhealthyResult, HealthStatus, ProcessInstanceTrait, StatusMonitor,
};

/// A configurable mock for ProcessInstanceTrait
#[derive(Clone)]
pub struct MockProcessInstance {
    /// Whether ping() should return true
    pub ping_result: Arc<AtomicBool>,
    /// The exit code to return from stop()
    pub exit_code: Arc<AtomicI32>,
    /// Whether shutdown has been triggered
    pub shutdown_triggered: Arc<AtomicBool>,
    /// Whether the process is "running"
    pub is_running: Arc<AtomicBool>,
}

impl Default for MockProcessInstance {
    fn default() -> Self {
        Self {
            ping_result: Arc::new(AtomicBool::new(true)),
            exit_code: Arc::new(AtomicI32::new(0)),
            shutdown_triggered: Arc::new(AtomicBool::new(false)),
            is_running: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl MockProcessInstance {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_ping_result(mut self, result: bool) -> Self {
        self.ping_result = Arc::new(AtomicBool::new(result));
        self
    }

    pub fn with_exit_code(mut self, code: i32) -> Self {
        self.exit_code = Arc::new(AtomicI32::new(code));
        self
    }

    pub fn set_ping_result(&self, result: bool) {
        self.ping_result.store(result, Ordering::SeqCst);
    }
}

#[async_trait]
impl ProcessInstanceTrait for MockProcessInstance {
    fn ping(&self) -> bool {
        self.is_running.load(Ordering::SeqCst) && self.ping_result.load(Ordering::SeqCst)
    }

    async fn start(&mut self, _task_tracker: TaskTracker) -> Result<(), anyhow::Error> {
        self.is_running.store(true, Ordering::SeqCst);
        self.shutdown_triggered.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.is_running.store(false, Ordering::SeqCst);
        self.shutdown_triggered.store(true, Ordering::SeqCst);
        Ok(self.exit_code.load(Ordering::SeqCst))
    }

    fn is_shutdown_triggered(&self) -> bool {
        self.shutdown_triggered.load(Ordering::SeqCst)
    }

    async fn wait(&mut self) -> Result<i32, anyhow::Error> {
        Ok(self.exit_code.load(Ordering::SeqCst))
    }

    async fn start_and_wait_for_output(
        &mut self,
        _task_tracker: TaskTracker,
    ) -> Result<(i32, Vec<String>, Vec<String>), anyhow::Error> {
        self.is_running.store(true, Ordering::SeqCst);
        Ok((self.exit_code.load(Ordering::SeqCst), vec![], vec![]))
    }
}

/// A configurable mock for StatusMonitor
#[derive(Clone)]
pub struct MockStatusMonitor {
    /// The health status to return
    pub health_status: Arc<std::sync::RwLock<HealthStatus>>,
    /// The result to return from handle_unhealthy
    pub unhealthy_result: Arc<std::sync::RwLock<HandleUnhealthyResult>>,
}

impl Default for MockStatusMonitor {
    fn default() -> Self {
        Self {
            health_status: Arc::new(std::sync::RwLock::new(HealthStatus::Healthy)),
            unhealthy_result: Arc::new(std::sync::RwLock::new(HandleUnhealthyResult::Continue)),
        }
    }
}

impl MockStatusMonitor {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_health_status(self, status: HealthStatus) -> Self {
        *self.health_status.write().unwrap() = status;
        self
    }

    pub fn with_unhealthy_result(self, result: HandleUnhealthyResult) -> Self {
        *self.unhealthy_result.write().unwrap() = result;
        self
    }

    pub fn set_health_status(&self, status: HealthStatus) {
        *self.health_status.write().unwrap() = status;
    }
}

#[async_trait]
impl StatusMonitor for MockStatusMonitor {
    async fn check_health(&self, _uptime: Duration, _timeout_duration: Duration) -> HealthStatus {
        self.health_status.read().unwrap().clone()
    }

    async fn handle_unhealthy(
        &self,
        _duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        Ok(self.unhealthy_result.read().unwrap().clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn mock_process_instance_starts_and_stops() {
        let mut mock = MockProcessInstance::new();
        let tracker = TaskTracker::new();

        assert!(!mock.ping());

        mock.start(tracker.clone()).await.unwrap();
        assert!(mock.ping());

        let exit_code = mock.stop().await.unwrap();
        assert_eq!(exit_code, 0);
        assert!(!mock.ping());
    }

    #[tokio::test]
    async fn mock_status_monitor_returns_configured_status() {
        let monitor = MockStatusMonitor::new().with_health_status(HealthStatus::Unhealthy);

        let status = monitor
            .check_health(Duration::from_secs(0), Duration::from_secs(5))
            .await;
        assert_eq!(status, HealthStatus::Unhealthy);
    }
}
