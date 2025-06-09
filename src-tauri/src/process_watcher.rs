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

use crate::binaries::{Binaries, BinaryResolver};
use crate::binary_integrity::BinaryIntegrityChecker;
use crate::configs::config_process_retry::{
    ConfigProcessRetry, ConfigProcessRetryContent, ProcessSpecificConfig,
};
use crate::configs::trait_config::ConfigImpl;
use crate::events::{BinaryCorruptionPayload, BinaryRetryPayload, RetryReason};
use crate::events_emitter::EventsEmitter;
use crate::process_adapter::ProcessInstanceTrait;
use crate::process_adapter::{HealthStatus, ProcessAdapter, StatusMonitor};
use crate::process_circuit_breaker::ProcessCircuitBreaker;
use futures_util::future::FusedFuture;
use log::{error, info, warn};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tokio::task::JoinHandle;

use tokio::select;
use tokio::sync::watch;
use tokio::time::{sleep, Instant, MissedTickBehavior};
use tokio_util::task::TaskTracker;

const LOG_TARGET: &str = "tari::universe::process_watcher";

#[derive(Debug, Clone, Default)]
pub(crate) struct ProcessWatcherStats {
    pub current_uptime: Duration,
    pub total_health_checks: u64,
    pub num_warnings: u64,
    pub num_failures: u64,
    pub num_restarts: u64,
    pub max_health_check_duration: Duration,
    pub total_health_check_duration: Duration,
}

pub struct ProcessWatcher<TAdapter: ProcessAdapter> {
    pub(crate) adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<i32, anyhow::Error>>>,
    internal_shutdown: Shutdown,
    pub poll_time: tokio::time::Duration,
    /// Health timeout should always be less than poll time otherwise you will have overlapping calls
    pub health_timeout: tokio::time::Duration,
    pub expected_startup_time: tokio::time::Duration,
    pub(crate) status_monitor: Option<TAdapter::StatusMonitor>,
    pub stop_on_exit_codes: Vec<i32>,
    stats_broadcast: watch::Sender<ProcessWatcherStats>,
    is_first_start: Arc<AtomicBool>,

    // Retry configuration
    retry_config: ConfigProcessRetryContent,
    process_specific_config: ProcessSpecificConfig,

    // State tracking
    startup_attempt_count: Arc<AtomicU8>,
    #[allow(dead_code)]
    runtime_restart_count: Arc<AtomicU8>,
    #[allow(dead_code)]
    has_been_healthy: Arc<AtomicBool>,
    last_binary_hash: Option<String>,
    binary_path: Option<PathBuf>,
    binary_type: Option<Binaries>,
    circuit_breaker: ProcessCircuitBreaker,
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(adapter: TAdapter, stats_broadcast: watch::Sender<ProcessWatcherStats>) -> Self {
        let adapter_name = adapter.name().to_string();
        Self {
            adapter,
            watcher_task: None,
            internal_shutdown: Shutdown::new(),
            poll_time: tokio::time::Duration::from_secs(5),
            health_timeout: tokio::time::Duration::from_secs(4),
            expected_startup_time: tokio::time::Duration::from_secs(20),
            status_monitor: None,
            stop_on_exit_codes: Vec::new(),
            stats_broadcast,
            is_first_start: Arc::new(AtomicBool::new(true)),
            retry_config: ConfigProcessRetryContent::default(),
            process_specific_config: ProcessSpecificConfig::default(),
            startup_attempt_count: Arc::new(AtomicU8::new(0)),
            runtime_restart_count: Arc::new(AtomicU8::new(0)),
            has_been_healthy: Arc::new(AtomicBool::new(false)),
            last_binary_hash: None,
            binary_path: None,
            binary_type: None,
            circuit_breaker: ProcessCircuitBreaker::new(
                adapter_name,
                5,                       // Default failure threshold
                Duration::from_secs(60), // Default recovery timeout
            ),
        }
    }

    pub async fn load_retry_config(&mut self) -> Result<(), anyhow::Error> {
        let config_instance = ConfigProcessRetry::current().await;
        let config_lock = config_instance.read().await;
        let process_name = self.adapter.name();

        // Get process-specific config or fall back to defaults
        let process_config = config_lock
            ._get_content()
            .get_config_for_process(process_name);

        self.retry_config = config_lock._get_content().clone();
        self.process_specific_config = process_config.clone();

        info!(target: LOG_TARGET, "Loaded retry config for process {}: {:?}", process_name, self.process_specific_config);
        Ok(())
    }

    pub fn set_binary_type(&mut self, binary_type: Binaries) {
        self.binary_type = Some(binary_type);
    }

    async fn get_binary_with_integrity_check(
        &mut self,
        binary: Binaries,
    ) -> Result<PathBuf, anyhow::Error> {
        let binary_path = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(binary)
            .await?;

        if !self.retry_config.enable_corruption_detection() {
            self.binary_path = Some(binary_path.clone());
            return Ok(binary_path);
        }

        // Check binary integrity if corruption detection is enabled
        let use_lenient = *self.retry_config.use_lenient_checksum_validation();

        let validation_result = if use_lenient {
            BinaryIntegrityChecker::validate_binary_integrity_smart(&binary_path, binary, None)
                .await
        } else {
            BinaryIntegrityChecker::validate_binary_integrity(&binary_path, binary).await
        };

        match validation_result {
            Ok(true) => {
                info!(target: LOG_TARGET, "Binary integrity check passed for {:?}", binary_path);
                // Cache the binary hash for runtime checking
                if let Ok(hash) = BinaryIntegrityChecker::cache_binary_hash(&binary_path).await {
                    self.last_binary_hash = Some(hash);
                }
                self.binary_path = Some(binary_path.clone());
                Ok(binary_path)
            }
            Ok(false) => {
                warn!(target: LOG_TARGET, "Binary integrity check failed for {:?}", binary_path);
                if *self.retry_config.corruption_redownload_enabled() {
                    self.handle_binary_corruption(binary, &binary_path).await
                } else {
                    Err(anyhow::anyhow!(
                        "Binary corruption detected and re-download is disabled"
                    ))
                }
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not verify binary integrity for {:?}: {}", binary_path, e);
                // If we can't verify, proceed anyway but emit warning
                self.binary_path = Some(binary_path.clone());
                Ok(binary_path)
            }
        }
    }

    async fn handle_binary_corruption(
        &mut self,
        binary: Binaries,
        corrupted_path: &Path,
    ) -> Result<PathBuf, anyhow::Error> {
        let process_name = self.adapter.name().to_string();

        // Emit corruption detected event
        EventsEmitter::emit_binary_corruption_detected(BinaryCorruptionPayload {
            process_name: process_name.clone(),
            binary_path: corrupted_path.display().to_string(),
            expected_hash: None, // Could be enhanced to include expected hash
            actual_hash: "unknown".to_string(), // Could be enhanced to include actual hash
            redownload_initiated: *self.retry_config.corruption_redownload_enabled(),
        })
        .await;

        if !*self.retry_config.corruption_redownload_enabled() {
            return Err(anyhow::anyhow!(
                "Binary corruption detected but re-download is disabled"
            ));
        }

        info!(target: LOG_TARGET, "Attempting to recover from binary corruption for {}", process_name);

        match BinaryIntegrityChecker::handle_corruption(binary, corrupted_path, &process_name).await
        {
            Ok(new_path) => {
                info!(target: LOG_TARGET, "Successfully recovered from binary corruption for {}", process_name);

                // Cache new binary hash
                if let Ok(hash) = BinaryIntegrityChecker::cache_binary_hash(&new_path).await {
                    self.last_binary_hash = Some(hash);
                }
                self.binary_path = Some(new_path.clone());

                // Emit integrity restored event
                EventsEmitter::emit_binary_integrity_restored(process_name).await;

                Ok(new_path)
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to recover from binary corruption for {}: {}", process_name, e);
                Err(e)
            }
        }
    }

    async fn spawn_with_startup_retries(
        &mut self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        binary_path: PathBuf,
        first_start: bool,
    ) -> Result<(TAdapter::ProcessInstance, TAdapter::StatusMonitor), anyhow::Error> {
        let name = self.adapter.name().to_string();
        let max_attempts = self.process_specific_config.max_startup_attempts;
        let retry_delay = self.process_specific_config.startup_retry_delay();

        for attempt in 1..=max_attempts {
            // Check circuit breaker before attempting
            if !self.circuit_breaker.should_attempt_retry() {
                if let Some(recovery_time) = self.circuit_breaker.get_time_until_recovery() {
                    warn!(target: LOG_TARGET, "Circuit breaker open for {}, blocking retry for {:?}", name, recovery_time);
                    return Err(anyhow::anyhow!(
                        "Circuit breaker open, retry blocked for {:?}",
                        recovery_time
                    ));
                }
            }

            // Emit startup attempt event
            if attempt > 1 {
                EventsEmitter::emit_binary_startup_attempt(BinaryRetryPayload {
                    process_name: name.clone(),
                    attempt_number: attempt,
                    max_attempts,
                    retry_reason: RetryReason::StartupFailure,
                    next_retry_in_seconds: if attempt < max_attempts {
                        Some(retry_delay.as_secs())
                    } else {
                        None
                    },
                })
                .await;
            }

            // Attempt to spawn the process
            match self.adapter.spawn(
                base_path.clone(),
                config_path.clone(),
                log_path.clone(),
                binary_path.clone(),
                first_start,
            ) {
                Ok(result) => {
                    info!(target: LOG_TARGET, "Successfully spawned {} on attempt {}", name, attempt);
                    // Record success in circuit breaker
                    self.circuit_breaker.record_success();
                    // Reset attempt counter on success
                    self.startup_attempt_count.store(0, Ordering::SeqCst);
                    return Ok(result);
                }
                Err(e) if attempt < max_attempts => {
                    warn!(target: LOG_TARGET, "Startup attempt {} failed for {}: {}, retrying in {:?}", 
                          attempt, name, e, retry_delay);

                    // Record failure in circuit breaker
                    self.circuit_breaker.record_failure();

                    // Update attempt counter
                    self.startup_attempt_count.store(attempt, Ordering::SeqCst);

                    // Wait before retrying
                    tokio::time::sleep(retry_delay).await;
                }
                Err(e) => {
                    // All attempts exhausted - emit permanent failure
                    error!(target: LOG_TARGET, "All {} startup attempts failed for {}: {}", max_attempts, name, e);

                    // Record failure in circuit breaker
                    self.circuit_breaker.record_failure();

                    EventsEmitter::emit_binary_permanent_failure(BinaryRetryPayload {
                        process_name: name.clone(),
                        attempt_number: attempt,
                        max_attempts,
                        retry_reason: RetryReason::StartupFailure,
                        next_retry_in_seconds: None,
                    })
                    .await;

                    return Err(anyhow::anyhow!(
                        "Failed to start {} after {} attempts: {}",
                        name,
                        max_attempts,
                        e
                    ));
                }
            }
        }

        unreachable!("Loop should have returned or errored before reaching this point")
    }
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub async fn kill_previous_instances(
        &mut self,
        base_path: PathBuf,
        binary_path: &Path,
    ) -> Result<(), anyhow::Error> {
        self.adapter
            .kill_previous_instances(base_path, binary_path)
            .await?;
        Ok(())
    }

    pub async fn start(
        &mut self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        binary: Binaries,
        global_shutdown_signal: ShutdownSignal,
        task_tracker: TaskTracker,
    ) -> Result<(), anyhow::Error> {
        if global_shutdown_signal.is_terminated() || global_shutdown_signal.is_triggered() {
            return Ok(());
        }

        let name = self.adapter.name().to_string();
        if self.watcher_task.is_some() {
            warn!(target: LOG_TARGET, "Tried to start process watcher for {} twice", name);
            self.stop().await?;
        }
        info!(target: LOG_TARGET, "Starting process watcher for {}", name);

        // Load retry configuration
        self.load_retry_config().await?;
        self.set_binary_type(binary);

        // Try to get binary with corruption checking and retries
        let binary_path = self.get_binary_with_integrity_check(binary).await?;
        self.kill_previous_instances(base_path.clone(), &binary_path)
            .await?;

        self.internal_shutdown = Shutdown::new();
        let mut inner_shutdown = self.internal_shutdown.to_signal();

        let poll_time = self.poll_time;
        let health_timeout = self.health_timeout;

        info!(target: LOG_TARGET, "Using {:?} for {}", binary_path, name);
        let first_start = self.is_first_start.load(Ordering::SeqCst);
        let (mut child, status_monitor) = self
            .spawn_with_startup_retries(base_path, config_path, log_path, binary_path, first_start)
            .await?;
        if first_start {
            self.is_first_start.store(false, Ordering::SeqCst);
        }
        let status_monitor2 = status_monitor.clone();
        self.status_monitor = Some(status_monitor);

        let expected_startup_time = self.expected_startup_time;
        let mut global_shutdown_signal: ShutdownSignal = global_shutdown_signal.clone();
        let task_tracker = task_tracker.clone();
        let stop_on_exit_codes = self.stop_on_exit_codes.clone();
        let stats_broadcast = self.stats_broadcast.clone();
        let process_specific_config = self.process_specific_config.clone();
        let runtime_restart_count = Arc::new(AtomicU8::new(0));
        let has_been_healthy = Arc::new(AtomicBool::new(false));

        self.watcher_task = Some(task_tracker.clone().spawn(async move {
            child.start(task_tracker.clone()).await?;
            let mut uptime = Instant::now();
            let mut stats = ProcessWatcherStats {
                current_uptime: Duration::from_secs(0),
                total_health_checks: 0,
                num_warnings: 0,
                num_failures: 0,
                num_restarts: 0,
                max_health_check_duration: Duration::from_secs(0),
                total_health_check_duration: Duration::from_secs(0),
            };
            // sleep(Duration::from_secs(10)).await;
            info!(target: LOG_TARGET, "Starting process watcher for {}", name);
            let mut watch_timer = tokio::time::interval(poll_time);
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Delay);
            let mut warning_count = 0;
            // read events such as stdout
            loop {
                select! {
                      _ = watch_timer.tick() => {
                        let status_monitor3 = status_monitor2.clone();

                        if let Some(exit_code) = do_health_check(
                            &mut child,
                            status_monitor3,
                            name.clone(),
                            &mut uptime,
                            expected_startup_time,
                            health_timeout,
                            global_shutdown_signal.clone(),
                            task_tracker.clone(),
                            inner_shutdown.clone(),
                            &mut warning_count,
                            &stop_on_exit_codes,
                            &mut stats,
                            &process_specific_config,
                            runtime_restart_count.clone(),
                            has_been_healthy.clone(),
                        ).await? {
                            return Ok(exit_code);
                        }
                    },
                    _ = inner_shutdown.wait() => {
                        return child.stop().await;

                    },
                    _ = global_shutdown_signal.wait() => {
                        return child.stop().await;
                    }
                }
                if let Err(_unused) = stats_broadcast.send(stats.clone()) {
                    warn!(target: LOG_TARGET, "Failed to broadcast process watcher stats");
                }
            }
        }));
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        if let Some(task) = self.watcher_task.as_ref() {
            !task.is_finished()
        } else {
            false
        }
    }

    #[allow(dead_code)]
    pub fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        self.adapter.pid_file_exisits(base_path)
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        if let Some(ref task) = self.watcher_task {
            if task.is_finished() {
                //let exit_code = task.await??;

                return Err(anyhow::anyhow!("Process watcher task has already finished"));
            }
        }
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.internal_shutdown.trigger();
        if let Some(task) = self.watcher_task.take() {
            let exit_code = task.await??;
            self.watcher_task = None;
            return Ok(exit_code);
        }
        Ok(0)
    }
}

#[allow(clippy::too_many_arguments)]
async fn do_health_check<TStatusMonitor: StatusMonitor, TProcessInstance: ProcessInstanceTrait>(
    child: &mut TProcessInstance,
    status_monitor3: TStatusMonitor,
    name: String,
    uptime: &mut Instant,
    expected_startup_time: Duration,
    health_timeout: Duration,
    global_shutdown_signal: ShutdownSignal,
    task_tracker: TaskTracker,
    inner_shutdown: ShutdownSignal,
    warning_count: &mut u32,
    stop_on_exit_codes: &[i32],
    stats: &mut ProcessWatcherStats,
    process_specific_config: &ProcessSpecificConfig,
    runtime_restart_count: Arc<AtomicU8>,
    has_been_healthy: Arc<AtomicBool>,
) -> Result<Option<i32>, anyhow::Error> {
    let mut is_healthy = false;
    let mut ping_failed = false;

    stats.total_health_checks += 1;
    let health_timer = Instant::now();
    if child.ping() {
        let mut inner_shutdown2 = inner_shutdown.clone();
        let mut app_shutdown2 = global_shutdown_signal.clone();
        let current_uptime = uptime.elapsed();

        match select! {
            r = status_monitor3.check_health(current_uptime, health_timeout) => r,
            // Watch for shutdown signals
            _ = inner_shutdown2.wait() => HealthStatus::Healthy,
            _ = app_shutdown2.wait() => HealthStatus::Healthy
        } {
            HealthStatus::Healthy => {
                *warning_count = 0;
                is_healthy = true;
                // Mark as healthy if this is the first time
                if !has_been_healthy.load(Ordering::SeqCst) {
                    has_been_healthy.store(true, Ordering::SeqCst);
                }
            }
            HealthStatus::Warning => {
                stats.num_warnings += 1;
                *warning_count += 1;
                if *warning_count > 10 {
                    error!(target: LOG_TARGET, "{} is not healthy. Health check returned warning", name);
                    *warning_count = 0;
                } else {
                    is_healthy = true;
                    // Mark as healthy if this is the first time
                    if !has_been_healthy.load(Ordering::SeqCst) {
                        has_been_healthy.store(true, Ordering::SeqCst);
                    }
                }
            }
            HealthStatus::Unhealthy => {
                warn!(target: LOG_TARGET, "{} is not healthy. Health check returned false", name);
            }
        }
    } else {
        ping_failed = true;
    }
    let health_check_duration = health_timer.elapsed();
    if health_check_duration > stats.max_health_check_duration {
        stats.max_health_check_duration = health_check_duration;
    }

    stats.total_health_check_duration += health_check_duration;

    if !is_healthy
        && !child.is_shutdown_triggered()
        && !global_shutdown_signal.is_triggered()
        && !inner_shutdown.is_triggered()
    {
        stats.num_failures += 1;
        if uptime.elapsed() < expected_startup_time && !ping_failed {
            warn!(target: LOG_TARGET, "{} is not healthy. Waiting for startup time to elapse", name);
        } else {
            match child.stop().await {
                Ok(exit_code) => {
                    if exit_code != 0 {
                        if stop_on_exit_codes.contains(&exit_code) {
                            return Ok(Some(exit_code));
                        }
                        warn!(target: LOG_TARGET, "{} exited with error code: {}, restarting because it is not a listed exit code to list for", name, exit_code);

                        // return Ok(exit_code);
                    } else {
                        info!(target: LOG_TARGET, "{} exited successfully", name);
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "{} exited with error: {}", name, e);
                    //   return Err(e);
                }
            }
            // Handle runtime restart with retry logic
            match handle_runtime_restart(
                child,
                status_monitor3,
                &name,
                uptime,
                task_tracker,
                stats,
                process_specific_config,
                runtime_restart_count,
                has_been_healthy,
            )
            .await
            {
                Ok(should_continue) => {
                    if !should_continue {
                        // Permanent failure - exit the watcher
                        return Ok(Some(1));
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Failed to handle runtime restart for {}: {}", name, e);
                    return Err(e);
                }
            }
        }
    } else {
        stats.current_uptime = uptime.elapsed();
    }
    Ok(None)
}

#[allow(clippy::too_many_arguments)]
async fn handle_runtime_restart<
    TStatusMonitor: StatusMonitor,
    TProcessInstance: ProcessInstanceTrait,
>(
    child: &mut TProcessInstance,
    status_monitor: TStatusMonitor,
    name: &str,
    uptime: &mut Instant,
    task_tracker: TaskTracker,
    stats: &mut ProcessWatcherStats,
    process_config: &ProcessSpecificConfig,
    runtime_restart_count: Arc<AtomicU8>,
    has_been_healthy: Arc<AtomicBool>,
) -> Result<bool, anyhow::Error> {
    // Only count as runtime failure if the process has been healthy before
    let is_runtime_failure = has_been_healthy.load(Ordering::SeqCst);

    if !is_runtime_failure {
        // This is still startup phase, use normal restart without counting against runtime retries
        warn!(target: LOG_TARGET, "Restarting {} during startup phase", name);
        *uptime = Instant::now();
        stats.num_restarts += 1;
        stats.current_uptime = uptime.elapsed();

        match status_monitor.handle_unhealthy().await {
            Ok(_) => {}
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to handle unhealthy {} status: {}", name, e)
            }
        }

        child.start(task_tracker).await?;
        sleep(Duration::from_secs(1)).await;
        return Ok(true);
    }

    // This is a runtime failure - check retry limits
    let current_restart_count = runtime_restart_count.load(Ordering::SeqCst);
    let max_attempts = process_config.max_runtime_restart_attempts;

    if current_restart_count >= max_attempts {
        // All runtime restart attempts exhausted
        error!(target: LOG_TARGET, "All {} runtime restart attempts exhausted for {}", max_attempts, name);

        EventsEmitter::emit_binary_permanent_failure(BinaryRetryPayload {
            process_name: name.to_string(),
            attempt_number: current_restart_count + 1,
            max_attempts,
            retry_reason: RetryReason::RuntimeCrash,
            next_retry_in_seconds: None,
        })
        .await;

        return Ok(false); // Don't continue - permanent failure
    }

    // Increment restart count
    let new_count = current_restart_count + 1;
    runtime_restart_count.store(new_count, Ordering::SeqCst);

    // Emit runtime restart event
    let retry_delay = process_config.runtime_restart_delay();
    EventsEmitter::emit_binary_runtime_restart(BinaryRetryPayload {
        process_name: name.to_string(),
        attempt_number: new_count,
        max_attempts,
        retry_reason: RetryReason::RuntimeCrash,
        next_retry_in_seconds: Some(retry_delay.as_secs()),
    })
    .await;

    warn!(target: LOG_TARGET, "Runtime restart attempt {} of {} for {}", new_count, max_attempts, name);

    // Wait for the configured delay
    sleep(retry_delay).await;

    // Reset uptime and stats
    *uptime = Instant::now();
    stats.num_restarts += 1;
    stats.current_uptime = uptime.elapsed();

    // Handle unhealthy status
    match status_monitor.handle_unhealthy().await {
        Ok(_) => {}
        Err(e) => {
            error!(target: LOG_TARGET, "Failed to handle unhealthy {} status: {}", name, e)
        }
    }

    // Start the process again
    child.start(task_tracker).await?;

    Ok(true) // Continue monitoring
}
