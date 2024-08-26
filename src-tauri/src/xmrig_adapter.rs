use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::process_utils;
use crate::xmrig::http_api::XmrigHttpApiClient;
use log::warn;
use std::path::PathBuf;
use tari_shutdown::Shutdown;

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
    node_connection: XmrigNodeConnection,
    monero_address: String,
    http_api_token: String,
    http_api_port: u16,
    cpu_max_percentage: usize,
    pub client: XmrigHttpApiClient,
    // TODO: secure
}

impl XmrigAdapter {
    pub fn new(
        xmrig_node_connection: XmrigNodeConnection,
        monero_address: String,
        cpu_max_percentage: usize,
    ) -> Self {
        let http_api_port = 9090;
        let http_api_token = "pass".to_string();
        Self {
            node_connection: xmrig_node_connection,
            monero_address,
            http_api_token: http_api_token.clone(),
            http_api_port,
            cpu_max_percentage,
            client: XmrigHttpApiClient::new(
                format!("http://127.0.0.1:{}", http_api_port).clone(),
                http_api_token.clone(),
            ),
        }
    }
}

impl ProcessAdapter for XmrigAdapter {
    type StatusMonitor = XmrigStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let xmrig_shutdown = Shutdown::new();
        let mut shutdown_signal = xmrig_shutdown.to_signal();
        let mut args = self.node_connection.generate_args();
        let xmrig_log_file = log_dir.join("xmrig.log");
        std::fs::create_dir_all(xmrig_log_file.parent().unwrap())?;

        args.push(format!("--log-file={}", &xmrig_log_file.to_str().unwrap()));
        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push(format!("--donate-level=1"));
        args.push(format!("--user={}", self.monero_address));
        args.push(format!(
            "--cpu-max-threads-hint={}",
            self.cpu_max_percentage
        ));

        Ok((
            ProcessInstance {
                shutdown: xmrig_shutdown,
                handle: Some(tokio::spawn(async move {
                    // TODO: Ensure version string is not malicious
                    let xmrig_dir = BinaryResolver::current()
                        .resolve_path(Binaries::Xmrig)
                        .await
                        .unwrap_or_else(|_| panic!("Could not resolve xmrig path"));
                    let xmrig_bin = xmrig_dir.join("xmrig");
                    let mut xmrig = process_utils::launch_child_process(&xmrig_bin, &args)?;
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

impl StatusMonitor for XmrigStatusMonitor {}

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
