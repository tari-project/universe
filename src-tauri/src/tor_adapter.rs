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

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU16, Ordering};
use std::time::Duration;

use anyhow::{Error, anyhow};
use async_trait::async_trait;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use tari_shutdown::Shutdown;
use tokio::fs;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::sync::watch;
use tokio::time::timeout;

use crate::port_allocator::PortAllocator;
use crate::process_adapter::HandleUnhealthyResult;
use crate::tor_control_client::{
    TorControlClient, TorStatus, control_auth_cookie_path, read_authentication_command,
};
use crate::{LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES};
use crate::{
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
    utils::file_utils::convert_to_string,
};

const TOR_CONTROL_TIMEOUT: Duration = Duration::from_secs(5);

pub(crate) struct TorAdapter {
    socks_port: u16,
    config_file: Option<PathBuf>,
    config: TorConfig,
    active_control_port: AtomicU16,
    cookie_path: std::sync::RwLock<Option<PathBuf>>,
    status_broadcast: watch::Sender<TorStatus>,
    restart_requested: watch::Sender<u64>,
    restart_generation: std::sync::Arc<std::sync::atomic::AtomicU64>,
}

fn prepare_tor_working_dir(data_dir: &Path, is_first_start: bool) -> Result<PathBuf, Error> {
    let working_dir: PathBuf = data_dir.join("tor-data");
    if is_first_start {
        info!(target: LOG_TARGET_APP_LOGIC, "Clearing tor data directory on first start");
        if std::fs::exists(&working_dir)? {
            std::fs::remove_dir_all(&working_dir)?;
            info!(target: LOG_TARGET_APP_LOGIC, "Removed tor data directory");
        }
    }
    std::fs::create_dir_all(&working_dir)?;
    Ok(working_dir)
}

impl TorAdapter {
    pub fn new(
        status_broadcast: watch::Sender<TorStatus>,
        restart_requested: watch::Sender<u64>,
    ) -> Self {
        let port = PortAllocator::new().assign_port_with_fallback();
        let config = TorConfig::default();
        let initial_control_port = config.control_port;

        Self {
            socks_port: port,
            config_file: None,
            config,
            active_control_port: AtomicU16::new(initial_control_port),
            cookie_path: std::sync::RwLock::new(None),
            status_broadcast,
            restart_requested,
            restart_generation: std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0)),
        }
    }

    pub async fn load_or_create_config(
        &mut self,
        config_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("tor_config.json");
        self.config_file = Some(file.clone());

        if file.exists() {
            debug!(target: LOG_TARGET_APP_LOGIC, "Loading tor config from file: {file:?}");
            let config = tokio::fs::read_to_string(&file).await?;
            self.apply_loaded_config(config);
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "App config does not exist or is corrupt. Creating new one");
        }

        self.update_config_file().await?;
        Ok(())
    }

    fn apply_loaded_config(&mut self, config: String) {
        let mut conf = serde_json::from_str::<TorConfig>(&config).unwrap_or_default();
        if conf.version < 1 {
            conf.control_port = 0;
            conf.version = 1;
        }

        self.active_control_port
            .store(conf.control_port, Ordering::Relaxed);
        self.config = conf;
    }

    async fn update_config_file(&mut self) -> Result<(), anyhow::Error> {
        let file = self
            .config_file
            .clone()
            .ok_or_else(|| anyhow!("Tor config file not set"))?;

        let config = serde_json::to_string(&self.config)?;
        debug!(target: LOG_TARGET_APP_LOGIC, "Updating tor config file: {:?} {:?}", file, self.config.clone());
        tokio::fs::write(file, config).await?;

        Ok(())
    }

    pub fn get_tor_config(&self) -> TorConfig {
        self.config.clone()
    }

    pub async fn set_tor_config(&mut self, config: TorConfig) -> Result<TorConfig, Error> {
        self.active_control_port
            .store(config.control_port, Ordering::Relaxed);
        self.config = config.clone();

        self.update_config_file().await?;
        Ok(config)
    }

    pub async fn get_entry_guards(&self) -> Result<Vec<String>, Error> {
        let control_port = self.active_control_port.load(Ordering::Relaxed);
        if control_port == 0 {
            return Err(anyhow!("Tor control port is not initialized"));
        }
        let cookie_path = self
            .cookie_path
            .read()
            .map_err(|_| anyhow!("Tor cookie path lock poisoned"))?
            .clone()
            .ok_or_else(|| anyhow!("Tor cookie path is not initialized"))?;
        let control_port_address = format!("127.0.0.1:{control_port}");

        timeout(TOR_CONTROL_TIMEOUT, async move {
            let auth_command = read_authentication_command(&cookie_path).await?;
            let stream = TcpStream::connect(&control_port_address).await?;
            let mut reader = BufReader::new(stream);

            reader.get_mut().write_all(auth_command.as_bytes()).await?;
            let mut response = String::new();
            reader.read_line(&mut response).await?;
            if response != "250 OK\r\n" {
                error!(target: LOG_TARGET_APP_LOGIC, "Tor AUTHENTICATE failed for: {control_port_address:?}");
                return Err(Error::msg("Authentication failed"));
            }

            // GETINFO entry-guards
            let getinfo_command = "GETINFO entry-guards\r\n";
            reader
                .get_mut()
                .write_all(getinfo_command.as_bytes())
                .await?;
            response.clear();
            reader.read_line(&mut response).await?;

            if response.starts_with("250+entry-guards=") || response.starts_with("250-entry-guards=") {
                let mut entry_guards: Vec<String> = vec![];
                loop {
                    response.clear();
                    let bytes_read = reader.read_line(&mut response).await?;
                    if bytes_read == 0 || response.trim() == "." {
                        break;
                    }
                    if response.starts_with("250 OK") {
                        break;
                    }
                    entry_guards.push(response.trim().to_string());
                }

                Ok(entry_guards)
            } else {
                error!(target: LOG_TARGET_APP_LOGIC, "Tor GETINFO entry-guards failed");
                Err(Error::msg("Failed to get entry guards"))
            }
        })
        .await
        .map_err(|_| anyhow!("Timed out reading Tor entry guards"))?
    }
}

impl ProcessAdapter for TorAdapter {
    type StatusMonitor = TorStatusMonitor;
    type ProcessInstance = ProcessInstance;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET_APP_LOGIC, "Starting tor");
        let data_dir = std::path::absolute(data_dir)?;
        let working_dir = prepare_tor_working_dir(&data_dir, is_first_start)?;
        let cookie_path = control_auth_cookie_path(&data_dir);
        *self
            .cookie_path
            .write()
            .map_err(|_| anyhow!("Tor cookie path lock poisoned"))? = Some(cookie_path.clone());

        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir.join("tor.log"))?;
        let torrc_string = convert_to_string(data_dir.join("torrc"))?;
        let mut lyrebird_path = binary_version_path.clone();
        lyrebird_path.pop();
        lyrebird_path.push("pluggable_transports");
        lyrebird_path.push("lyrebird");
        if cfg!(target_os = "windows") {
            lyrebird_path.set_extension("exe");
        }
        let mut control_port = self.config.control_port;
        if control_port == 0 {
            control_port = PortAllocator::new().assign_port_with_fallback();
        }
        self.active_control_port
            .store(control_port, Ordering::Relaxed);

        let mut args: Vec<String> = vec![
            "-f".to_string(),
            torrc_string,
            "--allow-missing-torrc".to_string(),
            "--ignore-missing-torrc".to_string(),
            "--clientonly".to_string(),
            "1".to_string(),
            "--socksport".to_string(),
            self.socks_port.to_string(),
            "--controlport".to_string(),
            format!("127.0.0.1:{}", control_port),
            "--CookieAuthentication".to_string(),
            "1".to_string(),
            "--CookieAuthFile".to_string(),
            convert_to_string(cookie_path)?,
            "--clientuseipv6".to_string(),
            "1".to_string(),
            "--DataDirectory".to_string(),
            working_dir_string,
            "--Log".to_string(),
            format!("notice file {}", log_dir_string),
        ];

        let envs = get_libevent_envs(&binary_version_path);

        if self.config.use_bridges {
            // Used by tor bridges
            // TODO: This does not work when path has space on windows.
            // Consider running lyrebird binary manually
            args.push("--ClientTransportPlugin".to_string());
            args.push(format!(
                "obfs4 exec {} managed",
                convert_to_string(lyrebird_path)?
            ));
            for bridge in &self.config.bridges {
                args.push("--Bridge".to_string());
                args.push(bridge.clone());
            }

            args.push("--UseBridges".to_string());
            args.push("1".to_string());
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs,
                    args,
                    data_dir: data_dir.clone(),
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                    output_sink: None,
                },
            },
            TorStatusMonitor {
                control_port,
                status_broadcast: self.status_broadcast.clone(),
                base_path: data_dir,
                restart_requested: self.restart_requested.clone(),
                restart_generation: self.restart_generation.clone(),
            },
        ))
    }

    fn name(&self) -> &str {
        "tor"
    }

    fn pid_file_name(&self) -> &str {
        "tor_pid"
    }
}

#[derive(Clone)]
pub(crate) struct TorStatusMonitor {
    pub control_port: u16,
    status_broadcast: watch::Sender<TorStatus>,
    base_path: PathBuf,
    restart_requested: watch::Sender<u64>,
    restart_generation: std::sync::Arc<std::sync::atomic::AtomicU64>,
}

impl TorStatusMonitor {
    pub fn cookie_path(&self) -> PathBuf {
        control_auth_cookie_path(&self.base_path)
    }
}

#[async_trait]
impl StatusMonitor for TorStatusMonitor {
    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        let client = TorControlClient::new(self.control_port, self.cookie_path());
        match timeout(timeout_duration, client.get_info()).await {
            Ok(Ok(status)) => {
                let _res = self.status_broadcast.send(status);
                if status.is_bootstrapped && status.network_liveness {
                    HealthStatus::Healthy
                } else {
                    warn!(target: LOG_TARGET_STATUSES, "Tor Healthcheck status: {status:?}");
                    HealthStatus::Warning
                }
            }
            Ok(Err(e)) => {
                warn!(target: LOG_TARGET_STATUSES, "Failed to get Tor Healthcheck status: {e}");
                HealthStatus::Unhealthy
            }
            Err(_) => {
                warn!(target: LOG_TARGET_STATUSES, "Tor Healthcheck timeout");
                HealthStatus::Unhealthy
            }
        }
    }

    async fn handle_unhealthy(
        &self,
        _duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        fs::remove_dir_all(self.base_path.join("tor-data")).await?;
        let generation = self.restart_generation.fetch_add(1, Ordering::Relaxed) + 1;
        let _ = self.restart_requested.send_replace(generation);

        Ok(HandleUnhealthyResult::Continue)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorConfig {
    #[serde(default)]
    version: u16,
    control_port: u16,
    use_bridges: bool,
    bridges: Vec<String>,
}

impl Default for TorConfig {
    fn default() -> Self {
        // let port = network_utils::get_free_port().unwrap_or(9061);
        TorConfig {
            version: 1,
            control_port: 0,
            use_bridges: false,
            bridges: Vec::new(),
        }
    }
}

#[cfg(target_os = "linux")]
fn get_libevent_envs(_binary_version_path: &std::path::Path) -> Option<HashMap<String, String>> {
    use crate::LOG_TARGET_APP_LOGIC;

    let mut tor_bundle_path = _binary_version_path.to_path_buf();
    tor_bundle_path.pop();
    let mut envs = HashMap::new();
    envs.insert(
        "LD_PRELOAD".to_string(),
        format!("{}/libevent-2.1.so.7", tor_bundle_path.display()),
    );
    log::warn!(target: LOG_TARGET_APP_LOGIC, "Using LD_PRELOAD for libevent-2.1.so.7.");
    Some(envs)
}

#[cfg(not(target_os = "linux"))]
fn get_libevent_envs(_binary_version_path: &std::path::Path) -> Option<HashMap<String, String>> {
    // For non-Linux, return None
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::net::TcpListener;

    #[test]
    fn test_spawn_args_require_cookie_authentication_under_tor_data() {
        let temp = tempfile::tempdir().expect("test setup succeeds");
        let (tx, _rx) = watch::channel(TorStatus::default());
        let (restart_tx, _restart_rx) = watch::channel(0);
        let adapter = TorAdapter::new(tx, restart_tx);
        let (process, _) = adapter
            .spawn_inner(
                temp.path().to_path_buf(),
                temp.path().to_path_buf(),
                temp.path().to_path_buf(),
                temp.path().join("tor"),
                false,
            )
            .expect("test setup succeeds");
        let args = &process.startup_spec.args;
        assert!(
            args.windows(2)
                .any(|pair| pair == ["--CookieAuthentication", "1"])
        );
        let expected = temp.path().join("tor-data/control_auth_cookie");
        assert!(args.windows(2).any(|pair| pair[0] == "--CookieAuthFile"
            && pair[1] == expected.to_str().expect("test setup succeeds")));
        assert!(!args.iter().any(|arg| arg == "--HashedControlPassword"));
    }

    #[test]
    fn prepare_tor_working_dir_clears_stale_files_and_recreates_dir_on_first_start() {
        let temp = tempfile::tempdir().expect("tempdir");
        let stale_dir = temp.path().join("tor-data");
        std::fs::create_dir_all(&stale_dir).expect("create stale dir");
        let stale_file = stale_dir.join("stale_state");
        std::fs::write(&stale_file, b"old").expect("write stale file");

        let working_dir =
            prepare_tor_working_dir(temp.path(), true).expect("prepare_tor_working_dir");
        assert!(
            working_dir.is_dir(),
            "tor-data must exist after first-start reset"
        );
        assert!(
            !stale_file.exists(),
            "stale files inside tor-data must be cleared"
        );
    }

    #[cfg(unix)]
    #[test]
    fn first_start_fails_if_stale_tor_directory_cannot_be_removed() {
        use std::os::unix::fs::PermissionsExt;

        let temp = tempfile::tempdir().expect("tempdir");
        let stale_dir = temp.path().join("tor-data");
        std::fs::create_dir_all(&stale_dir).expect("create stale dir");
        let stale_file = stale_dir.join("stale_state");
        std::fs::write(&stale_file, b"old").expect("write stale file");
        std::fs::set_permissions(temp.path(), std::fs::Permissions::from_mode(0o555))
            .expect("make parent read-only");

        let result = prepare_tor_working_dir(temp.path(), true);
        std::fs::set_permissions(temp.path(), std::fs::Permissions::from_mode(0o755))
            .expect("restore parent permissions");
        assert!(result.is_err(), "Tor must not start with stale state");
    }

    #[tokio::test]
    async fn get_entry_guards_uses_allocated_active_control_port_and_crlf() {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let port = listener.local_addr().expect("addr").port();

        let server = tokio::spawn(async move {
            let (stream, _) = listener.accept().await.expect("accept");
            let mut reader = BufReader::new(stream);
            let mut line = String::new();
            reader.read_line(&mut line).await.expect("read auth");
            assert_eq!(line, format!("AUTHENTICATE {}\r\n", "ab".repeat(32)));
            reader
                .get_mut()
                .write_all(b"250 OK\r\n")
                .await
                .expect("write auth ok");

            line.clear();
            reader.read_line(&mut line).await.expect("read getinfo");
            assert_eq!(line, "GETINFO entry-guards\r\n");
            reader
                .get_mut()
                .write_all(b"250+entry-guards=\r\n$AAA~guard1 up\r\n.\r\n250 OK\r\n")
                .await
                .expect("write guards");
        });

        let (tx, _rx) = watch::channel(TorStatus::default());
        let (restart_tx, _restart_rx) = watch::channel(0);
        let adapter = TorAdapter::new(tx, restart_tx);
        adapter.active_control_port.store(port, Ordering::Relaxed);
        let temp = tempfile::tempdir().expect("test setup succeeds");
        let cookie_path = temp.path().join("cookie");
        std::fs::write(&cookie_path, [0xab; 32]).expect("test setup succeeds");
        *adapter.cookie_path.write().expect("test setup succeeds") = Some(cookie_path);

        let guards = adapter.get_entry_guards().await.expect("entry guards");
        assert_eq!(guards, vec!["$AAA~guard1 up".to_string()]);
        server.await.expect("server join");
    }

    #[tokio::test]
    async fn get_entry_guards_rejects_failed_or_malformed_authentication() {
        let temp = tempfile::tempdir().expect("tempdir");
        let cookie_path = temp.path().join("cookie");
        std::fs::write(&cookie_path, [0xab; 32]).expect("write cookie");
        for reply in ["515 Authentication failed\r\n", "250 OK unexpected\r\n", ""] {
            let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
            let (tx, _rx) = watch::channel(TorStatus::default());
            let (restart_tx, _restart_rx) = watch::channel(0);
            let adapter = TorAdapter::new(tx, restart_tx);
            adapter.active_control_port.store(
                listener.local_addr().expect("addr").port(),
                Ordering::Relaxed,
            );
            *adapter.cookie_path.write().expect("cookie lock") = Some(cookie_path.clone());
            let (result, ()) = tokio::join!(adapter.get_entry_guards(), async {
                let (stream, _) = listener.accept().await.expect("accept");
                let mut reader = BufReader::new(stream);
                let mut line = String::new();
                reader.read_line(&mut line).await.expect("read auth");
                reader
                    .get_mut()
                    .write_all(reply.as_bytes())
                    .await
                    .expect("auth reply");
            });
            assert!(result.is_err(), "must reject {reply:?}");
        }
    }

    #[tokio::test]
    async fn handle_unhealthy_increments_restart_generation_and_notifies() {
        let temp = tempfile::tempdir().expect("tempdir");
        let tor_data = temp.path().join("tor-data");
        std::fs::create_dir_all(&tor_data).expect("create tor-data");
        std::fs::write(tor_data.join("lock"), b"lock").expect("write lock");

        let (status_tx, _status_rx) = watch::channel(TorStatus::default());
        let (restart_tx, restart_rx) = watch::channel(0);
        let adapter = TorAdapter::new(status_tx, restart_tx);
        let (_, monitor) = adapter
            .spawn_inner(
                temp.path().to_path_buf(),
                temp.path().to_path_buf(),
                temp.path().to_path_buf(),
                temp.path().join("tor"),
                false,
            )
            .expect("spawn_inner succeeds");

        assert_eq!(*restart_rx.borrow(), 0);
        let res = monitor
            .handle_unhealthy(Duration::from_secs(120))
            .await
            .expect("handle_unhealthy");
        assert!(matches!(res, HandleUnhealthyResult::Continue));
        assert!(
            !tor_data.exists(),
            "tor-data must be cleared on unhealthy restart"
        );
        assert_eq!(*restart_rx.borrow(), 1, "restart generation must increment");
    }
}
