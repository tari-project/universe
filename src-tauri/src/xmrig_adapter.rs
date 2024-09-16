use crate::binary_resolver::VersionDownloadInfo;
use crate::download_utils::{download_file_with_retries, extract};
use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::{error, info, warn};
use semver::Version;
use tari_shutdown::Shutdown;
use tokio::fs;

use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::xmrig::latest_release::{fetch_xmrig_latest_release, find_version_for_platform};
use crate::{process_utils, ProgressTracker};

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
    version: String,
    node_connection: XmrigNodeConnection,
    monero_address: String,
    http_api_token: String,
    http_api_port: u16,
    cache_dir: PathBuf,
    cpu_max_percentage: isize,
    pub client: XmrigHttpApiClient,
    // TODO: secure
}

impl XmrigAdapter {
    pub fn new(
        xmrig_node_connection: XmrigNodeConnection,
        monero_address: String,
        cache_dir: PathBuf,
        cpu_max_percentage: isize,
        version: String,
    ) -> Self {
        let http_api_port = 9090;
        let http_api_token = "pass".to_string();
        Self {
            node_connection: xmrig_node_connection,
            monero_address,
            http_api_token: http_api_token.clone(),
            http_api_port,
            cache_dir,
            cpu_max_percentage,
            version,
            client: XmrigHttpApiClient::new(
                format!("http://127.0.0.1:{}", http_api_port).clone(),
                http_api_token.clone(),
            ),
        }
    }

    async fn get_latest_local_version(cache_dir: PathBuf) -> Result<String, Error> {
        let mut latest_version = None;
        let xmrig_dir = cache_dir.join("xmrig");
        if !xmrig_dir.exists() {
            return Err(anyhow::anyhow!(
                "Failed to get latest release and no local version for xmrig found"
            ));
        }
        let mut read_dir = fs::read_dir(xmrig_dir).await?;

        while let Some(entry) = read_dir.next_entry().await? {
            let path = entry.path();
            if path.is_dir() {
                let dir_name = path.file_name().unwrap().to_str().unwrap();
                match Version::parse(dir_name) {
                    Ok(version) => {
                        if latest_version.clone().is_none()
                            || version > latest_version.clone().unwrap()
                        {
                            latest_version = Some(version);
                        }
                    }
                    Err(_) => {
                        // Ignore directories that don't have a valid version name
                    }
                }
            }
        }

        match latest_version.clone() {
            Some(version) => Ok(version.to_string()),
            None => Err(anyhow::anyhow!("Failed to get latest release for xmrig")),
        }
    }

    pub async fn ensure_latest(
        cache_dir: PathBuf,
        force_download: bool,
        progress_tracker: ProgressTracker,
    ) -> Result<String, Error> {
        let latest_release_res = fetch_xmrig_latest_release().await;

        let latest_release: VersionDownloadInfo = if latest_release_res.is_err() {
            return XmrigAdapter::get_latest_local_version(cache_dir.clone()).await;
        } else {
            // fetched properly so it can be unwrapped
            latest_release_res?
        };

        let xmrig_dir = cache_dir
            .join("xmrig")
            .join(latest_release.version.to_string());
        if force_download && xmrig_dir.exists() {
            println!("Cleaning up xmrig dir");
            fs::remove_dir_all(&xmrig_dir).await.inspect_err(
                |e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e),
            )?;
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

            let asset = find_version_for_platform(&latest_release)?;
            println!("Downloading file");
            println!("Downloading file from {}", &asset.url);

            let in_progress_file = in_progress_dir.join(&asset.name);
            match download_file_with_retries(&asset.url, &in_progress_file, progress_tracker).await
            {
                Ok(_) => {}
                Err(_) => match XmrigAdapter::get_latest_local_version(cache_dir.clone()).await {
                    Ok(local_version) => {
                        info!(target: LOG_TARGET, "Failed to download latest release for xmrig, used local: {:?}", local_version);
                        return Ok(local_version);
                    }
                    Err(_) => {
                        return Err(anyhow::anyhow!(
                            "Failed to download latest release for xmrig, couldn't use local one"
                        ))
                    }
                },
            };

            println!("Renaming file");
            println!("Extracting file");
            extract(&in_progress_file, &xmrig_dir).await?;
            fs::remove_dir_all(in_progress_dir).await?;
        }
        Ok(latest_release.version.to_string())
    }
}

impl ProcessAdapter for XmrigAdapter {
    type StatusMonitor = XmrigStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let cache_dir = self.cache_dir.clone();
        let xmrig_shutdown = Shutdown::new();
        let mut shutdown_signal = xmrig_shutdown.to_signal();
        let mut args = self.node_connection.generate_args();
        let xmrig_log_file = log_dir.join("xmrig.log");
        std::fs::create_dir_all(xmrig_log_file.parent().unwrap())?;

        args.push(format!("--log-file={}", &xmrig_log_file.to_str().unwrap()));
        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push("--donate-level=1".to_string());
        args.push(format!("--user={}", self.monero_address));
        args.push(format!("--threads={}", self.cpu_max_percentage));

        let version = self.version.clone();

        Ok((
            ProcessInstance {
                shutdown: xmrig_shutdown,
                handle: Some(tokio::spawn(async move {
                    let xmrig_dir = cache_dir
                        .clone()
                        .join("xmrig")
                        .join(&version)
                        .join(format!("xmrig-{}", version));
                    let xmrig_bin = xmrig_dir.join("xmrig");
                    let mut xmrig = process_utils::launch_child_process(&xmrig_bin, None, &args)?;

                    if let Some(id) = xmrig.id() {
                        std::fs::write(data_dir.join("xmrig_pid"), id.to_string())?;
                    }
                    shutdown_signal.wait().await;

                    xmrig.kill().await?;

                    match std::fs::remove_file(data_dir.join("xmrig_pid")) {
                        Ok(_) => {}
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Could not clear xmrig's pid file -  {e}");
                        }
                    }

                    Ok(0)
                })),
            },
            XmrigStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "xmrig"
    }

    fn pid_file_name(&self) -> &str {
        "xmrig_pid"
    }
}

pub struct XmrigStatusMonitor {}

#[async_trait]
impl StatusMonitor for XmrigStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
    }
}
