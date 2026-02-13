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

//! Unit tests for process_watcher::do_health_check function

use std::sync::atomic::Ordering;
use std::time::Duration;

use tari_shutdown::Shutdown;
use tokio::time::Instant;
use tokio_util::task::TaskTracker;

use crate::process_adapter::{HandleUnhealthyResult, HealthStatus, ProcessInstanceTrait};
use crate::process_watcher::{ProcessWatcherStats, do_health_check};
use crate::testing::mocks::process_mocks::{MockProcessInstance, MockStatusMonitor};

async fn setup_test_context() -> (
    MockProcessInstance,
    MockStatusMonitor,
    Instant,
    Duration,
    Shutdown,
    TaskTracker,
    Shutdown,
    ProcessWatcherStats,
) {
    let mut child = MockProcessInstance::new();
    let tracker = TaskTracker::new();
    child.start(tracker.clone()).await.unwrap();

    let status_monitor = MockStatusMonitor::new();
    let uptime = Instant::now();
    let duration_since_last_healthy = Duration::from_secs(0);
    let global_shutdown = Shutdown::new();
    let inner_shutdown = Shutdown::new();
    let stats = ProcessWatcherStats::default();

    (
        child,
        status_monitor,
        uptime,
        duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        stats,
    )
}

#[tokio::test]
async fn healthy_status_resets_warning_count() {
    let (
        mut child,
        status_monitor,
        mut uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    let mut warning_count = 5u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(warning_count, 0);
    assert_eq!(duration_since_last_healthy, Duration::from_secs(0));
}

#[tokio::test]
async fn initializing_status_not_healthy_but_no_restart() {
    let (
        mut child,
        status_monitor,
        mut uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Initializing);

    let mut warning_count = 5u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(300),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(warning_count, 0);
    assert!(child.is_running.load(Ordering::SeqCst));
}

#[tokio::test]
async fn warning_under_threshold_treated_as_healthy() {
    let (
        mut child,
        status_monitor,
        mut uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Warning);

    let mut warning_count = 5u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(warning_count, 6);
    assert_eq!(duration_since_last_healthy, Duration::from_secs(0));
    assert_eq!(stats.num_warnings, 1);
}

#[tokio::test]
async fn warning_over_threshold_resets_count() {
    let (
        mut child,
        status_monitor,
        mut uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Warning);

    let mut warning_count = 10u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(300),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(warning_count, 0);
    assert_eq!(stats.num_warnings, 1);
}

#[tokio::test]
async fn unhealthy_during_startup_waits_no_restart() {
    let (
        mut child,
        status_monitor,
        mut uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);

    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(300),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_failures, 1);
    assert_eq!(stats.num_restarts, 0);
    assert!(child.is_running.load(Ordering::SeqCst));
}

#[tokio::test]
async fn unhealthy_after_startup_triggers_restart() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_failures, 1);
    assert_eq!(stats.num_restarts, 1);
    assert!(child.is_running.load(Ordering::SeqCst));
}

#[tokio::test]
async fn ping_failure_triggers_restart_after_startup() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    child.set_ping_result(false);

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_failures, 1);
    assert_eq!(stats.num_restarts, 1);
}

#[tokio::test]
async fn stop_on_exit_code_returns_exit_code() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);
    child.exit_code.store(42, Ordering::SeqCst);

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();
    let stop_on_exit_codes = [42, 100];

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &stop_on_exit_codes,
        &mut stats,
    )
    .await
    .unwrap();

    assert_eq!(result, Some(42));
}

#[tokio::test]
async fn non_listed_exit_code_triggers_restart() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);
    child.exit_code.store(99, Ordering::SeqCst);

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();
    let stop_on_exit_codes = [42, 100];

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &stop_on_exit_codes,
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_restarts, 1);
}

#[tokio::test]
async fn handle_unhealthy_stop_returns_exit_code() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);
    *status_monitor.unhealthy_result.write().unwrap() = HandleUnhealthyResult::Stop;

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert_eq!(result, Some(1));
}

#[tokio::test]
async fn handle_unhealthy_continue_restarts_process() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);
    *status_monitor.unhealthy_result.write().unwrap() = HandleUnhealthyResult::Continue;

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_restarts, 1);
    assert!(child.is_running.load(Ordering::SeqCst));
}

#[tokio::test]
async fn shutdown_signal_prevents_restart() {
    let (
        mut child,
        status_monitor,
        _uptime,
        mut duration_since_last_healthy,
        mut global_shutdown,
        tracker,
        inner_shutdown,
        mut stats,
    ) = setup_test_context().await;

    status_monitor.set_health_status(HealthStatus::Unhealthy);
    global_shutdown.trigger();

    let mut uptime = Instant::now() - Duration::from_secs(60);
    let mut warning_count = 0u32;
    let unhealthy_timer = Instant::now();

    let result = do_health_check(
        &mut child,
        status_monitor,
        "test_process".to_string(),
        &mut uptime,
        &mut duration_since_last_healthy,
        unhealthy_timer,
        Duration::from_secs(30),
        Duration::from_secs(10),
        global_shutdown.to_signal(),
        tracker,
        inner_shutdown.to_signal(),
        &mut warning_count,
        &[],
        &mut stats,
    )
    .await
    .unwrap();

    assert!(result.is_none());
    assert_eq!(stats.num_restarts, 0);
}
