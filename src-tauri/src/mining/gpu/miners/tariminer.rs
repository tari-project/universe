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
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{
        Arc, Mutex, RwLock,
        atomic::{AtomicBool, AtomicU32, Ordering},
    },
    time::{Duration, Instant},
};

use axum::async_trait;
use log::{info, warn};
use regex::Regex;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES,
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{
        GpuConnectionType, MiningError,
        gpu::{
            consts::{GpuMinerStatus, GpuMinerType},
            interface::{GpuMinerInterfaceTrait, GpuMinerStatusInterface},
            manager::GpuManager,
            miners::GpuCommonInformation,
        },
    },
    process_adapter::{
        HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
        StatusMonitor,
    },
    process_utils::launch_child_process,
};

/// TARI.Miner has no status API, it prints a periodic speed report to stdout instead, so silence is
/// all we have to detect a stall with. How long silence has to last before it means anything
/// depends on how quickly the miner's stdout reaches us.
///
/// TARI.Miner starts with `setvbuf(stdout, NULL, _IOLBF, 0)`. glibc honours that and line buffers,
/// so on Linux every report arrives as it is printed and a couple of missed reports is already a
/// real gap. The statically linked MSVC CRT used for the Windows build documents `_IOLBF` as
/// behaving like `_IOFBF` and rejects a zero buffer size outright, so a piped stdout stays block
/// buffered there and roughly 4 KB of reports have to pile up before any of them are flushed. That
/// delays the evidence, it does not remove it, so the same rule applies on a much longer clock.
const SPEED_SAMPLE_STALE_AFTER_SECS: u64 = if cfg!(target_os = "windows") {
    20 * 60
} else {
    2 * 60
};
const SPEED_SAMPLE_STALE_AFTER: Duration = Duration::from_secs(SPEED_SAMPLE_STALE_AFTER_SECS);
/// What a freshly started miner gets on top of the stale window before its silence counts against
/// it. Building the CUDA context, allocating the solver pipelines and completing the stratum
/// handshake all happen before the first graph, and that alone already outlasts the process
/// watcher's 20s expected startup time. Restarting during it just starts the same wait over again.
const STARTUP_ALLOWANCE_SECS: u64 = 3 * 60;
const STARTUP_GRACE_PERIOD: Duration =
    Duration::from_secs(SPEED_SAMPLE_STALE_AFTER_SECS + STARTUP_ALLOWANCE_SECS);
/// How many restarts in a row may fail to produce a single graph before we give up on this miner
/// and let the manager fall back to another one.
///
/// The watcher's `duration_since_last_healthy_status` cannot carry this decision: it only advances
/// on restarts, and a miner that spends every start-up grace period initializing accumulates it far
/// too slowly to ever reach the three minute threshold below.
const MAX_BARREN_RESTARTS: u32 = 3;
/// How long the miner may stay unhealthy while still producing graphs before we fall back.
const UNHEALTHY_FALLBACK_AFTER: Duration = Duration::from_secs(3 * 60);
/// Sub folder of the extracted release archive that holds the per architecture backends.
const BACKENDS_FOLDER: &str = "bin";
/// How long `nvidia-smi` gets to enumerate the GPUs before we give up on it.
/// Device detection runs inside the GPU setup phase with the `GpuManager` write lock held, so a
/// wedged NVIDIA driver hanging here would park every other caller of that lock for the session.
const DEVICE_DETECTION_TIMEOUT: Duration = Duration::from_secs(15);

/// The CUDA backend that TARI.Miner ships one binary for per supported compute capability.
/// The upstream starter script picks the backend the same way, from `nvidia-smi --query-gpu=compute_cap`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TariMinerBackend {
    /// RTX 30 series
    #[default]
    Sm86,
    /// RTX 40 series
    Sm89,
    /// RTX 50 series
    Sm120,
}

impl TariMinerBackend {
    fn from_compute_capability(compute_capability: &str) -> Option<Self> {
        match compute_capability.trim() {
            "8.6" => Some(TariMinerBackend::Sm86),
            "8.9" => Some(TariMinerBackend::Sm89),
            "12.0" => Some(TariMinerBackend::Sm120),
            _ => None,
        }
    }

    fn file_stem(self) -> &'static str {
        match self {
            TariMinerBackend::Sm86 => "tari_c29_pool_miner_sm_86",
            TariMinerBackend::Sm89 => "tari_c29_pool_miner_sm_89",
            TariMinerBackend::Sm120 => "tari_c29_pool_miner_sm_120",
        }
    }

    /// Path of the backend inside the extracted release archive.
    pub fn relative_binary_path(self) -> PathBuf {
        PathBuf::from(BACKENDS_FOLDER).join(self.file_stem())
    }
}

/// The archive ships every backend, but the binary resolver and the process watcher both need a
/// single path. Device detection publishes the backend that matches the GPU we are going to mine
/// with here so that both agree on which one to resolve, set permissions on and spawn.
static SELECTED_BACKEND: RwLock<TariMinerBackend> = RwLock::new(TariMinerBackend::Sm86);

/// Returns the backend that matches the GPU TARI.Miner will be started on.
/// Falls back to the default backend before any device was detected; every backend is present in
/// the archive, so resolving the binary path stays valid either way.
pub fn selected_backend() -> TariMinerBackend {
    SELECTED_BACKEND
        .read()
        .map(|backend| *backend)
        .unwrap_or_default()
}

fn publish_selected_backend(backend: TariMinerBackend) {
    match SELECTED_BACKEND.write() {
        Ok(mut selected) => *selected = backend,
        Err(error) => {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not store the selected TARI.Miner backend: {error}");
        }
    }
}

/// An NVIDIA device that TARI.Miner has a backend for.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TariMinerDevice {
    pub common: GpuCommonInformation,
    pub backend: TariMinerBackend,
}

/// Parses `nvidia-smi --query-gpu=index,compute_cap,name --format=csv,noheader,nounits`.
/// Devices with a compute capability that has no backend in the release archive are dropped,
/// mirroring what the upstream starter script does.
fn parse_nvidia_smi_devices(output: &str) -> Vec<TariMinerDevice> {
    let mut devices = vec![];

    for line in output.lines() {
        let mut fields = line.split(',');
        let (Some(index), Some(compute_capability), Some(name)) =
            (fields.next(), fields.next(), fields.next())
        else {
            continue;
        };

        let Ok(device_id) = index.trim().parse::<u32>() else {
            continue;
        };

        let Some(backend) = TariMinerBackend::from_compute_capability(compute_capability) else {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Skipping GPU {device_id}: compute capability {} is not supported by TARI.Miner",
                compute_capability.trim()
            );
            continue;
        };

        devices.push(TariMinerDevice {
            common: GpuCommonInformation {
                name: name.trim().to_string(),
                device_id,
            },
            backend,
        });
    }

    devices
}

/// TARI.Miner drives a single GPU per process, so we mine with the first device the user did not
/// exclude.
fn select_device<'a>(
    devices: &'a [TariMinerDevice],
    excluded_devices: &[u32],
) -> Result<&'a TariMinerDevice, anyhow::Error> {
    if devices.is_empty() {
        return Err(anyhow::anyhow!(
            "No TARI.Miner compatible GPU devices found"
        ));
    }

    devices
        .iter()
        .find(|device| !excluded_devices.contains(&device.common.device_id))
        .ok_or_else(|| MiningError::AllDevicesExcluded.into())
}

/// The manager hands us the pool specific worker name with its login separator prefixed
/// (`.Tari-universe` for LuckyPool, `/Tari-universe` for Kryptex). TARI.Miner takes the two apart,
/// so we split them back up here. A worker name without a leading separator keeps the miner's
/// own default.
fn split_worker_name(worker_name: &str) -> (Option<&str>, &str) {
    match worker_name.split_at_checked(1) {
        Some((separator @ ("." | "/"), worker)) => (Some(separator), worker),
        _ => (None, worker_name),
    }
}

/// Extracts the graph rate from TARI.Miner's periodic stdout report, which looks like
/// `speed 4.21 g/s | graphs=42 cycles=1 submitted=1 accepted=1 rejected=0`.
fn parse_speed_line(line: &str) -> Option<f64> {
    static SPEED_PATTERN: std::sync::LazyLock<Option<Regex>> =
        std::sync::LazyLock::new(|| Regex::new(r"speed[= ]([0-9]+(?:\.[0-9]+)?)\s*g/s").ok());

    let captures = SPEED_PATTERN.as_ref()?.captures(line)?;
    captures.get(1)?.as_str().parse::<f64>().ok()
}

/// What the status monitor knows about the miner's output at a point in time.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct TariMinerSpeedSnapshot {
    /// The last graph rate, if one was reported recently enough to still be meaningful.
    pub fresh_speed: Option<f64>,
    /// Whether this miner instance has ever reported a graph rate.
    /// Before that, silence means "still starting up"; after it, silence means "went quiet".
    pub has_ever_reported: bool,
}

/// The last report and the "has reported at all" latch live behind one lock on purpose.
/// Reading them separately lets a report that lands between the two reads produce
/// `(fresh_speed: None, has_ever_reported: true)` for a miner that is mining perfectly, which reads
/// as a stall and gets the miner killed and restarted.
#[derive(Default)]
struct TariMinerSpeedState {
    last_report: Option<(f64, Instant)>,
    has_ever_reported: bool,
}

/// Keeps the last graph rate TARI.Miner reported on stdout so the status monitor can read it.
#[derive(Clone, Default)]
pub struct TariMinerSpeedTracker {
    state: Arc<Mutex<TariMinerSpeedState>>,
}

impl TariMinerSpeedTracker {
    fn record_line(&self, line: &str) {
        let Some(speed) = parse_speed_line(line) else {
            return;
        };

        match self.state.lock() {
            Ok(mut state) => {
                state.last_report = Some((speed, Instant::now()));
                state.has_ever_reported = true;
            }
            Err(error) => {
                warn!(target: LOG_TARGET_STATUSES, "Could not store the TARI.Miner speed sample: {error}");
            }
        }
    }

    fn snapshot(&self) -> TariMinerSpeedSnapshot {
        let Ok(state) = self.state.lock() else {
            return TariMinerSpeedSnapshot::default();
        };

        TariMinerSpeedSnapshot {
            fresh_speed: state.last_report.and_then(|(speed, reported_at)| {
                (reported_at.elapsed() <= SPEED_SAMPLE_STALE_AFTER).then_some(speed)
            }),
            has_ever_reported: state.has_ever_reported,
        }
    }

    /// Forgets everything the previous process reported.
    /// The watcher reuses the monitor across restarts, so without this a restarted miner would
    /// inherit the old instance's "has reported" latch and its first silent seconds would read as a
    /// stall instead of a start-up.
    fn reset(&self) {
        if let Ok(mut state) = self.state.lock() {
            *state = TariMinerSpeedState::default();
        }
    }
}

/// Decides what a health check should report, given how long the process has been up and what the
/// miner has said so far. Split out from `check_health` so the policy can be tested directly.
fn resolve_health_status(uptime: Duration, snapshot: TariMinerSpeedSnapshot) -> HealthStatus {
    if snapshot.fresh_speed.is_some() {
        return HealthStatus::Healthy;
    }

    if !snapshot.has_ever_reported && uptime < STARTUP_GRACE_PERIOD {
        return HealthStatus::Initializing;
    }

    HealthStatus::Unhealthy
}

/// Decides whether the manager should stop trying this miner and fall back to another one.
/// Split out from `handle_unhealthy` so the policy can be tested directly.
fn should_fall_back_to_another_miner(
    barren_restarts: u32,
    duration_since_last_healthy_status: Duration,
) -> bool {
    barren_restarts >= MAX_BARREN_RESTARTS
        || duration_since_last_healthy_status > UNHEALTHY_FALLBACK_AFTER
}

#[derive(Default)]
pub struct TariMinerGpuMiner {
    pub tari_address: Option<String>,
    pub intensity_percentage: Option<u32>,
    pub worker_name: Option<String>,
    pub connection_type: Option<GpuConnectionType>,
    pub gpu_status_sender: Sender<GpuMinerStatus>,
    pub gpu_devices: Vec<TariMinerDevice>,
    pub excluded_devices: Vec<u32>,
}

impl TariMinerGpuMiner {
    pub fn new(gpu_status_sender: Sender<GpuMinerStatus>) -> Self {
        Self {
            tari_address: None,
            intensity_percentage: None,
            worker_name: None,
            connection_type: None,
            gpu_status_sender,
            gpu_devices: vec![],
            excluded_devices: vec![],
        }
    }

    /// Keeps the globally resolved backend in sync with the device we would mine with.
    fn refresh_selected_backend(&self) {
        if let Ok(device) = select_device(&self.gpu_devices, &self.excluded_devices) {
            publish_selected_backend(device.backend);
        }
    }
}

impl GpuMinerInterfaceTrait for TariMinerGpuMiner {
    async fn load_tari_address(&mut self, tari_address: &str) -> Result<(), anyhow::Error> {
        self.tari_address = Some(tari_address.to_string());
        Ok(())
    }
    async fn load_worker_name(&mut self, worker_name: Option<&str>) -> Result<(), anyhow::Error> {
        self.worker_name = worker_name.map(|name| name.to_string());
        Ok(())
    }
    async fn load_intensity_percentage(
        &mut self,
        intensity_percentage: u32,
    ) -> Result<(), anyhow::Error> {
        self.intensity_percentage = Some(intensity_percentage);
        Ok(())
    }
    async fn load_connection_type(
        &mut self,
        connection_type: GpuConnectionType,
    ) -> Result<(), anyhow::Error> {
        self.connection_type = Some(connection_type);
        Ok(())
    }

    async fn load_excluded_devices(
        &mut self,
        excluded_devices: Vec<u32>,
    ) -> Result<(), anyhow::Error> {
        self.excluded_devices = excluded_devices;
        self.refresh_selected_backend();
        Ok(())
    }

    /// TARI.Miner has no device listing of its own, it enumerates NVIDIA GPUs with `nvidia-smi`.
    async fn detect_devices(&mut self) -> Result<(), anyhow::Error> {
        let config_path =
            dirs::config_dir().ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?;

        let config_dir = config_path.join(APPLICATION_FOLDER_ID);

        let args = vec![
            "--query-gpu=index,compute_cap,name".to_string(),
            "--format=csv,noheader,nounits".to_string(),
        ];

        let result = launch_child_process(Path::new("nvidia-smi"), &config_dir, None, &args, true)
            .map_err(|e| {
                anyhow::anyhow!("Could not run nvidia-smi to enumerate NVIDIA GPUs: {e}")
            })?;

        let output = tokio::time::timeout(DEVICE_DETECTION_TIMEOUT, result.wait_with_output())
            .await
            .map_err(|_| {
                anyhow::anyhow!(
                    "nvidia-smi did not respond within {}s",
                    DEVICE_DETECTION_TIMEOUT.as_secs()
                )
            })??;
        if !output.status.success() {
            return Err(anyhow::anyhow!(
                "nvidia-smi could not enumerate NVIDIA GPUs: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            ));
        }

        let gpu_devices = parse_nvidia_smi_devices(&String::from_utf8_lossy(&output.stdout));
        if gpu_devices.is_empty() {
            return Err(anyhow::anyhow!(
                "No TARI.Miner compatible GPU devices found"
            ));
        }

        for device in &gpu_devices {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "TARI.Miner detected device {} [{}] -> {:?} backend",
                device.common.device_id, device.common.name, device.backend
            );
        }

        self.gpu_devices = gpu_devices;
        self.refresh_selected_backend();

        let common_devices: Vec<GpuCommonInformation> = self
            .gpu_devices
            .iter()
            .map(|device| device.common.clone())
            .collect();
        let devices_indexes: Vec<u32> = common_devices.iter().map(|d| d.device_id).collect();

        EventsEmitter::emit_detected_devices(common_devices).await;
        ConfigMining::update_field(
            ConfigMiningContent::populate_gpu_devices_settings,
            (GpuMinerType::TariMiner, devices_indexes),
        )
        .await?;

        EventsEmitter::emit_update_gpu_devices_settings(
            ConfigMining::content()
                .await
                .gpu_devices_settings_by_miner()
                .clone(),
        )
        .await;

        Ok(())
    }
}

impl ProcessAdapter for TariMinerGpuMiner {
    type ProcessInstance = ProcessInstance;
    type StatusMonitor = GpuMinerStatusInterface;

    fn spawn_inner(
        &self,
        base_folder: std::path::PathBuf,
        _config_folder: std::path::PathBuf,
        _log_folder: std::path::PathBuf,
        binary_version_path: std::path::PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();
        let device = select_device(&self.gpu_devices, &self.excluded_devices)?;

        let mut args: Vec<String> =
            vec!["--device".to_string(), device.common.device_id.to_string()];

        if let Some(connection_type) = &self.connection_type {
            match connection_type {
                GpuConnectionType::Node {
                    node_grpc_address: _,
                } => {
                    return Err(anyhow::anyhow!("TARI.Miner does not support node mining"));
                }
                GpuConnectionType::Pool { pool_url } => {
                    args.push("--pool".to_string());
                    args.push(pool_url.clone());
                }
            }
        } else {
            return Err(anyhow::anyhow!(
                "Connection type must be set before starting the TariMinerGpuMiner"
            ));
        }

        if let Some(tari_address) = &self.tari_address {
            args.push("--wallet".to_string());
            args.push(tari_address.clone());
        } else {
            return Err(anyhow::anyhow!(
                "Tari address must be set before starting the TariMinerGpuMiner"
            ));
        }

        if let Some(worker_name) = &self.worker_name {
            let (login_separator, worker) = split_worker_name(worker_name);
            args.push("--worker".to_string());
            args.push(worker.to_string());
            if let Some(login_separator) = login_separator {
                args.push("--login-separator".to_string());
                args.push(login_separator.to_string());
            }
        }

        if let Some(intensity) = self.intensity_percentage {
            args.push("--intensity".to_string());
            args.push(intensity.clamp(1, 100).to_string());
        }

        info!(
            target: LOG_TARGET_APP_LOGIC,
            "TARI.Miner mining on device {} [{}] with binary: {}",
            device.common.device_id,
            device.common.name,
            binary_version_path.display()
        );

        #[cfg(target_os = "windows")]
        add_firewall_rule(
            format!("{}.exe", device.backend.file_stem()),
            binary_version_path.clone(),
        )?;

        // `--device` is passed straight to `cudaSetDevice`, so it is a CUDA ordinal, while the id
        // we detected is the nvidia-smi index. CUDA orders by speed unless told otherwise, so on a
        // mixed rig the two disagree and we would mine on a card the user excluded, with the wrong
        // architecture's backend. nvidia-smi indexes by PCI bus id, so ask CUDA for the same order.
        // This pins the ordering, it cannot recover an index: a CUDA_VISIBLE_DEVICES already set in
        // the user's environment hides devices from the child, and the two would disagree again.
        let envs = HashMap::from([("CUDA_DEVICE_ORDER".to_string(), "PCI_BUS_ID".to_string())]);

        let speed_tracker = TariMinerSpeedTracker::default();
        let output_sink = {
            let speed_tracker = speed_tracker.clone();
            Arc::new(move |line: &str| speed_tracker.record_line(line))
        };

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown.clone(),
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir: base_folder,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                    output_sink: Some(output_sink),
                },
                handle: None,
            },
            GpuMinerStatusInterface::TariMiner(TariMinerGpuMinerStatusMonitor {
                gpu_status_sender: self.gpu_status_sender.clone(),
                speed_tracker,
                barren_restarts: Arc::new(AtomicU32::new(0)),
            }),
        ))
    }

    fn name(&self) -> &str {
        "tariminer"
    }

    fn pid_file_name(&self) -> &str {
        "tariminer_pid"
    }
}

#[derive(Clone)]
pub struct TariMinerGpuMinerStatusMonitor {
    gpu_status_sender: Sender<GpuMinerStatus>,
    speed_tracker: TariMinerSpeedTracker,
    /// Restarts in a row that ended without the miner reporting a single graph.
    /// The watcher keeps one monitor for the whole run, so this survives the restarts it counts.
    barren_restarts: Arc<AtomicU32>,
}

// This is a flag to indicate if the fallback to other miner has already been triggered
// We want to avoid triggering it multiple times per session
static WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[async_trait]
impl StatusMonitor for TariMinerGpuMinerStatusMonitor {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        // The watcher calls this right before restarting the miner and reuses this monitor for the
        // new process, so the previous instance's output must not colour the new one's health.
        // Whether that instance ever mined has to be read before the reset clears it.
        let barren_restarts = if self.speed_tracker.snapshot().has_ever_reported {
            self.barren_restarts.store(0, Ordering::Relaxed);
            0
        } else {
            self.barren_restarts.fetch_add(1, Ordering::Relaxed) + 1
        };
        self.speed_tracker.reset();

        info!(target: LOG_TARGET_STATUSES, "Handling unhealthy status for TariMinerGpuMiner | Duration since last healthy status: {}s | Restarts without a single graph: {barren_restarts}", duration_since_last_healthy_status.as_secs());
        if should_fall_back_to_another_miner(barren_restarts, duration_since_last_healthy_status)
            && !WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.load(Ordering::SeqCst)
        {
            match GpuManager::write().await.handle_unhealthy_miner().await {
                Ok(_) => {
                    info!(target: LOG_TARGET_STATUSES, "TariMinerGpuMiner: fell back to another miner due to prolonged unhealthiness.");
                    WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.store(true, Ordering::SeqCst);
                    return Ok(HandleUnhealthyResult::Stop);
                }
                Err(error) => {
                    warn!(target: LOG_TARGET_STATUSES, "TariMinerGpuMiner: Failed to fall back to another miner: {error} | Continuing to monitor.");
                    return Ok(HandleUnhealthyResult::Continue);
                }
            }
        } else {
            return Ok(HandleUnhealthyResult::Continue);
        }
    }

    async fn check_health(&self, uptime: Duration, _timeout_duration: Duration) -> HealthStatus {
        let snapshot = self.speed_tracker.snapshot();
        let health_status = resolve_health_status(uptime, snapshot);
        let _ = self
            .gpu_status_sender
            .send(Self::status(&health_status, snapshot));

        match health_status {
            HealthStatus::Healthy => {
                if !GpuManager::read().await.is_current_miner_healthy().await {
                    info!(target: LOG_TARGET_STATUSES, "Marking current miner as healthy again");
                    let _unused = GpuManager::write().await.handle_healthy_miner().await;
                }
            }
            HealthStatus::Initializing => {
                info!(target: LOG_TARGET_STATUSES, "TARI.Miner has not reported a graph rate yet, still starting up");
            }
            _ => {
                warn!(target: LOG_TARGET_STATUSES, "TARI.Miner has not reported a graph rate for {}s", SPEED_SAMPLE_STALE_AFTER.as_secs());
            }
        }

        health_status
    }
}

impl TariMinerGpuMinerStatusMonitor {
    /// Health, not the presence of a speed report, decides whether we are mining: where stdout is
    /// block buffered the miner can be mining for minutes without having told us its rate, and
    /// reporting that as "not mining" would be a plain misreport. The rate itself stays best effort.
    fn status(health_status: &HealthStatus, snapshot: TariMinerSpeedSnapshot) -> GpuMinerStatus {
        if matches!(health_status, HealthStatus::Healthy) {
            return GpuMinerStatus {
                is_mining: true,
                hash_rate: snapshot.fresh_speed.unwrap_or(0.0),
                estimated_earnings: 0,
                algorithm: GpuMinerType::TariMiner.main_algorithm(),
            };
        }

        GpuMinerStatus::default_with_algorithm(GpuMinerType::TariMiner.main_algorithm())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn snapshot(fresh_speed: Option<f64>, has_ever_reported: bool) -> TariMinerSpeedSnapshot {
        TariMinerSpeedSnapshot {
            fresh_speed,
            has_ever_reported,
        }
    }

    fn device(device_id: u32, backend: TariMinerBackend) -> TariMinerDevice {
        TariMinerDevice {
            common: GpuCommonInformation {
                name: format!("GPU {device_id}"),
                device_id,
            },
            backend,
        }
    }

    #[test]
    fn backend_is_resolved_from_the_compute_capability() {
        assert_eq!(
            TariMinerBackend::from_compute_capability("8.6"),
            Some(TariMinerBackend::Sm86)
        );
        assert_eq!(
            TariMinerBackend::from_compute_capability(" 8.9 "),
            Some(TariMinerBackend::Sm89)
        );
        assert_eq!(
            TariMinerBackend::from_compute_capability("12.0"),
            Some(TariMinerBackend::Sm120)
        );
        assert_eq!(TariMinerBackend::from_compute_capability("7.5"), None);
    }

    #[test]
    fn nvidia_smi_output_is_parsed_and_unsupported_devices_are_dropped() {
        let output = "0, 8.9, NVIDIA GeForce RTX 4090\n1, 7.5, NVIDIA GeForce GTX 1660\n2, 12.0, NVIDIA GeForce RTX 5090\n";

        let devices = parse_nvidia_smi_devices(output);

        assert_eq!(devices.len(), 2);
        assert_eq!(devices[0].common.device_id, 0);
        assert_eq!(devices[0].common.name, "NVIDIA GeForce RTX 4090");
        assert_eq!(devices[0].backend, TariMinerBackend::Sm89);
        assert_eq!(devices[1].common.device_id, 2);
        assert_eq!(devices[1].backend, TariMinerBackend::Sm120);
    }

    #[test]
    fn malformed_nvidia_smi_lines_are_ignored() {
        let output = "\nnot a device row\n0, 8.6, NVIDIA GeForce RTX 3080\nx, 8.6, Broken index\n";

        let devices = parse_nvidia_smi_devices(output);

        assert_eq!(
            devices,
            vec![TariMinerDevice {
                common: GpuCommonInformation {
                    name: "NVIDIA GeForce RTX 3080".to_string(),
                    device_id: 0,
                },
                backend: TariMinerBackend::Sm86,
            }]
        );
    }

    #[test]
    fn the_first_device_that_is_not_excluded_is_selected() {
        let devices = vec![
            device(0, TariMinerBackend::Sm86),
            device(1, TariMinerBackend::Sm120),
        ];

        assert_eq!(select_device(&devices, &[]).ok(), Some(&devices[0]));
        assert_eq!(select_device(&devices, &[0]).ok(), Some(&devices[1]));
    }

    #[test]
    fn selecting_a_device_fails_when_all_of_them_are_excluded() {
        let devices = vec![device(0, TariMinerBackend::Sm86)];

        let error = select_device(&devices, &[0]).expect_err("all devices are excluded");

        assert!(matches!(
            error.downcast_ref::<MiningError>(),
            Some(MiningError::AllDevicesExcluded)
        ));
        assert!(select_device(&[], &[]).is_err());
    }

    #[test]
    fn the_login_separator_is_split_off_the_worker_name() {
        assert_eq!(
            split_worker_name(".Tari-universe"),
            (Some("."), "Tari-universe")
        );
        assert_eq!(
            split_worker_name("/Tari-universe"),
            (Some("/"), "Tari-universe")
        );
        assert_eq!(split_worker_name("Tari-universe"), (None, "Tari-universe"));
        assert_eq!(split_worker_name(""), (None, ""));
    }

    #[test]
    fn the_graph_rate_is_read_from_the_periodic_speed_report() {
        assert_eq!(
            parse_speed_line(
                "speed 4.21 g/s | graphs=42 cycles=1 submitted=1 accepted=1 rejected=0"
            ),
            Some(4.21)
        );
        assert_eq!(
            parse_speed_line(
                "graphs=42 elapsed=10.00s speed=4.215 g/s cycles=1 submitted=1 verify_failures=0"
            ),
            Some(4.215)
        );
        assert_eq!(parse_speed_line("share accepted (3 total)"), None);
    }

    #[test]
    fn a_recorded_speed_is_reported_and_a_missing_one_is_not() {
        let tracker = TariMinerSpeedTracker::default();
        assert_eq!(tracker.snapshot(), snapshot(None, false));

        tracker.record_line("share accepted (3 total)");
        assert_eq!(tracker.snapshot(), snapshot(None, false));

        tracker
            .record_line("speed 4.21 g/s | graphs=42 cycles=1 submitted=1 accepted=1 rejected=0");
        assert_eq!(tracker.snapshot(), snapshot(Some(4.21), true));
    }

    #[test]
    fn resetting_the_tracker_makes_a_restarted_miner_look_freshly_started() {
        let tracker = TariMinerSpeedTracker::default();
        tracker
            .record_line("speed 4.21 g/s | graphs=42 cycles=1 submitted=1 accepted=1 rejected=0");

        tracker.reset();

        assert_eq!(tracker.snapshot(), snapshot(None, false));
        // ...so the restarted process reads as starting up rather than as the previous instance
        // stalling, and the watcher does not restart it straight back into the same wait.
        assert_eq!(
            resolve_health_status(Duration::from_secs(25), tracker.snapshot()),
            HealthStatus::Initializing
        );
    }

    #[test]
    fn a_miner_that_has_not_reported_yet_is_initializing_for_the_whole_grace_period() {
        let starting_up = snapshot(None, false);

        // The watcher's 20s expected startup time is nowhere near a CUDA context plus a stratum
        // handshake, so the case that matters is well past it.
        for uptime in [
            Duration::ZERO,
            Duration::from_secs(25),
            STARTUP_GRACE_PERIOD - Duration::from_secs(1),
        ] {
            assert_eq!(
                resolve_health_status(uptime, starting_up),
                HealthStatus::Initializing,
                "uptime {uptime:?} should still count as starting up"
            );
        }

        assert_ne!(
            resolve_health_status(STARTUP_GRACE_PERIOD, starting_up),
            HealthStatus::Initializing
        );
    }

    #[test]
    fn a_reporting_miner_is_healthy_whatever_its_uptime() {
        let mining = snapshot(Some(4.21), true);

        assert_eq!(
            resolve_health_status(Duration::ZERO, mining),
            HealthStatus::Healthy
        );
        assert_eq!(
            resolve_health_status(Duration::from_secs(60 * 60), mining),
            HealthStatus::Healthy
        );
    }

    #[test]
    fn the_reported_status_follows_health_rather_than_the_presence_of_a_speed_report() {
        let mining = TariMinerGpuMinerStatusMonitor::status(
            &HealthStatus::Healthy,
            snapshot(Some(4.21), true),
        );
        assert!(mining.is_mining);
        assert!((mining.hash_rate - 4.21).abs() < f64::EPSILON);

        // Healthy but silent (block buffered stdout): still mining, rate simply unknown.
        let silent =
            TariMinerGpuMinerStatusMonitor::status(&HealthStatus::Healthy, snapshot(None, false));
        assert!(silent.is_mining);
        assert!((silent.hash_rate - 0.0).abs() < f64::EPSILON);

        for health_status in [HealthStatus::Initializing, HealthStatus::Unhealthy] {
            let status =
                TariMinerGpuMinerStatusMonitor::status(&health_status, snapshot(Some(4.21), true));
            assert!(
                !status.is_mining,
                "{health_status:?} must not report mining"
            );
            assert!((status.hash_rate - 0.0).abs() < f64::EPSILON);
        }
    }

    #[test]
    fn silence_counts_as_a_stall_once_the_miner_has_had_its_chance() {
        let past_grace = STARTUP_GRACE_PERIOD + Duration::from_secs(1);

        // Went quiet after having reported, and never reported at all past the grace period.
        assert_eq!(
            resolve_health_status(Duration::ZERO, snapshot(None, true)),
            HealthStatus::Unhealthy
        );
        assert_eq!(
            resolve_health_status(past_grace, snapshot(None, false)),
            HealthStatus::Unhealthy
        );
    }

    #[test]
    fn the_startup_grace_period_outlasts_the_window_a_speed_report_may_take_to_arrive() {
        // Otherwise a miner is declared stalled while its very first report is still in flight,
        // which on a block buffered stdout is most of the start-up.
        assert!(STARTUP_GRACE_PERIOD > SPEED_SAMPLE_STALE_AFTER);
    }

    #[test]
    fn a_miner_that_never_produces_a_graph_is_given_up_on_after_a_few_restarts() {
        // The accumulated unhealthy time never gets there on its own: it only advances on
        // restarts, and this miner spends each start-up grace period reporting Initializing.
        let barely_any_unhealthy_time = Duration::from_secs(5);

        for barren_restarts in 0..MAX_BARREN_RESTARTS {
            assert!(
                !should_fall_back_to_another_miner(barren_restarts, barely_any_unhealthy_time),
                "gave up after only {barren_restarts} barren restarts"
            );
        }

        assert!(should_fall_back_to_another_miner(
            MAX_BARREN_RESTARTS,
            barely_any_unhealthy_time
        ));
    }

    #[test]
    fn a_miner_that_keeps_going_unhealthy_while_mining_is_still_given_up_on_eventually() {
        assert!(!should_fall_back_to_another_miner(
            0,
            UNHEALTHY_FALLBACK_AFTER
        ));
        assert!(should_fall_back_to_another_miner(
            0,
            UNHEALTHY_FALLBACK_AFTER + Duration::from_secs(1)
        ));
    }

    #[test]
    fn a_snapshot_never_shows_a_reported_miner_as_having_gone_quiet() {
        // Reading the last report and the "has reported" latch separately lets a report that lands
        // between the two reads produce (None, true), which reads as a stall and gets a perfectly
        // healthy miner killed and restarted.
        let tracker = TariMinerSpeedTracker::default();
        let recorder = tracker.clone();

        let writer = std::thread::spawn(move || {
            for graphs in 0..5_000 {
                recorder.record_line(&format!(
                    "speed 4.21 g/s | graphs={graphs} cycles=1 submitted=1 accepted=1 rejected=0"
                ));
            }
        });

        for _ in 0..5_000 {
            let snapshot = tracker.snapshot();
            assert!(
                snapshot.fresh_speed.is_some() || !snapshot.has_ever_reported,
                "observed a torn snapshot: {snapshot:?}"
            );
        }

        writer.join().expect("recording thread");
        assert_eq!(tracker.snapshot(), snapshot(Some(4.21), true));
    }

    #[test]
    fn every_backend_resolves_to_a_binary_inside_the_archive() {
        assert_eq!(
            TariMinerBackend::Sm120.relative_binary_path(),
            PathBuf::from("bin").join("tari_c29_pool_miner_sm_120")
        );
    }
}
