use crate::cpu_miner::CpuMinerEvent;
use crate::download_utils::{download_file, extract};
use crate::process_killer::kill_process;
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::xmrig::latest_release::fetch_latest_release;
use crate::ProgressTracker;
use anyhow::Error;
use log::{debug, info, warn};
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tokio::fs;
use tokio::runtime::Handle;
use tokio::sync::mpsc::Receiver;
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::xmrig_adapter";

pub enum XmrigNodeConnection {
    LocalMmproxy { host_name: String, port: u16 },
}

impl XmrigNodeConnection {
    pub fn generate_args(&self) -> Vec<String> {
        match self {
            XmrigNodeConnection::LocalMmproxy { host_name, port } => {
                vec![
                    "--daemon".to_string(),
                    format!("--url={}:{}", host_name, port),
                    "--coin=monero".to_string(),
                    // TODO: Generate password
                    "--http-port".to_string(),
                    "9090".to_string(),
                    "--http-access-token=pass".to_string(),
                ]
            }
        }
    }
}

pub struct XmrigAdapter {
    force_download: bool,
    node_connection: XmrigNodeConnection,
    monero_address: String,
    // TODO: secure
    http_api_token: String,
    http_api_port: u16,
}

pub struct XmrigInstance {
    shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

impl XmrigAdapter {
    pub fn new(xmrig_node_connection: XmrigNodeConnection, monero_address: String) -> Self {
        Self {
            force_download: false,
            node_connection: xmrig_node_connection,
            monero_address,
            http_api_token: "pass".to_string(),
            http_api_port: 9090,
        }
    }
    pub fn spawn(
        &self,
        cache_dir: PathBuf,
        logs_dir: PathBuf,
        data_dir: PathBuf,
        progress_tracker: ProgressTracker,
        cpu_max_percentage: usize,
    ) -> Result<(Receiver<CpuMinerEvent>, XmrigInstance, XmrigHttpApiClient), anyhow::Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let (_tx, rx) = tokio::sync::mpsc::channel(100);
        let force_download = self.force_download;
        let xmrig_shutdown = Shutdown::new();
        let mut shutdown_signal = xmrig_shutdown.to_signal();
        let mut args = self.node_connection.generate_args();
        let xmrig_log_file = logs_dir.join("xmrig.log");
        std::fs::create_dir_all(xmrig_log_file.parent().unwrap())?;
        args.push(format!("--log-file={}", &xmrig_log_file.to_str().unwrap()));
        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push("--donate-level=1".to_string());
        args.push(format!("--user={}", self.monero_address));
        args.push(format!("--threads={}", cpu_max_percentage));

        let client = XmrigHttpApiClient::new(
            format!("http://127.0.0.1:{}", self.http_api_port),
            self.http_api_token.clone(),
        );

        Ok((
            rx,
            XmrigInstance {
                shutdown: xmrig_shutdown,
                handle: Some(tokio::spawn(async move {
                    // TODO: Ensure version string is not malicious
                    let version =
                        Self::ensure_latest(cache_dir.clone(), force_download, progress_tracker)
                            .await?;
                    let xmrig_dir = cache_dir
                        .join("xmrig")
                        .join(&version)
                        .join(format!("xmrig-{}", version));
                    let xmrig_bin = xmrig_dir.join("xmrig");
                    let mut xmrig = tokio::process::Command::new(xmrig_bin)
                        .args(args)
                        .kill_on_drop(true)
                        .spawn()?;

                    if let Some(id) = xmrig.id() {
                        std::fs::write(data_dir.join("xmrig_pid"), id.to_string())?;
                    }
                    shutdown_signal.wait().await;
                    println!("Stopping xmrig");

                    xmrig.kill().await?;

                    match std::fs::remove_file(data_dir.join("xmrig_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear xmrig's pid file");
                        }
                    }

                    Ok(())
                })),
            },
            client,
        ))
    }

    pub async fn ensure_latest(
        cache_dir: PathBuf,
        force_download: bool,
        progress_tracker: ProgressTracker,
    ) -> Result<String, Error> {
        dbg!(&cache_dir);
        let latest_release = fetch_latest_release().await?;
        let xmrig_dir = cache_dir.join("xmrig").join(&latest_release.version);
        if force_download {
            println!("Cleaning up xmrig dir");
            let _ = fs::remove_dir_all(&xmrig_dir).await;
        }
        if !xmrig_dir.exists() {
            println!("Latest version of xmrig doesn't exist");
            println!("latest version is {}", latest_release.version);
            let in_progress_dir = cache_dir.join("xmrig").join("in_progress");
            if in_progress_dir.exists() {
                println!("Trying to delete dir {:?}", in_progress_dir);
                match fs::remove_dir(&in_progress_dir).await {
                    Ok(_) => {}
                    Err(e) => {
                        println!("Failed to delete dir {:?}", e);
                        // return Err(e.into());
                    }
                }
            }

            let id = get_os_string_id();
            info!(target: LOG_TARGET, "Downloading xmrig for {}", &id);
            let platform = latest_release
                .get_asset(&id)
                .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
            println!("Downloading file");
            println!("Downloading file from {}", &platform.url);

            let in_progress_file = in_progress_dir.join(&platform.name);
            download_file(&platform.url, &in_progress_file, progress_tracker).await?;

            println!("Renaming file");
            println!("Extracting file");
            extract(&in_progress_file, &xmrig_dir).await?;
            fs::remove_dir_all(in_progress_dir).await?;
        }

        Ok(latest_release.version)
    }

    fn kill_previous_instances(&self, base_folder: PathBuf) -> Result<(), Error> {
        match std::fs::read_to_string(base_folder.join("xmrig_pid")) {
            Ok(pid) => {
                let pid = pid.trim().parse::<u32>()?;
                kill_process(pid)?;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not read xmrigs pid file: {}", e);
            }
        }
        Ok(())
    }
}

impl XmrigInstance {
    pub fn ping(&self) -> Result<bool, anyhow::Error> {
        Ok(self
            .handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false))
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle.unwrap().await?
    }
    pub fn kill(&self) -> Result<(), anyhow::Error> {
        todo!()
        // Ok(())
    }
}

impl Drop for XmrigInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                let _ = handle.await.unwrap().map_err(|e| {
                    warn!(target: LOG_TARGET, "Error in XmrigInstance: {}", e);
                });
            });
        }
    }
}

#[allow(unreachable_code)]
fn get_os_string_id() -> String {
    #[cfg(target_os = "windows")]
    {
        return "msvc-win64".to_string();
    }

    #[cfg(target_os = "macos")]
    {
        #[cfg(target_arch = "x86_64")]
        {
            return "macos-x64".to_string();
        }

        #[cfg(target_arch = "aarch64")]
        {
            // the x64 seems to work better on the M1
            return "macos-arm64".to_string();
            // return "macos-x64".to_string();
        }
    }

    #[cfg(target_os = "linux")]
    {
        return "linux-static-x64".to_string();
    }

    #[cfg(target_os = "freebsd")]
    {
        return "freebsd-static-x64".to_string();
    }

    panic!("Unsupported OS");
}
