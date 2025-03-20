use anyhow::anyhow;
use log::{info, warn};
use regex::Regex;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::TcpStream,
};

const LOG_TARGET: &str = "tari::universe::tor_control_client";
const BOOTSTRAP_QUERY: &str = "GETINFO status/bootstrap-phase\r\n";
const AUTH_COMMAND: &str = "AUTHENTICATE\r\n";
const CIRCUIT_QUERY: &str = "GETINFO status/circuit-established\r\n";
const NETWORK_QUERY: &str = "GETINFO network-liveness\r\n";

#[derive(Debug, Clone)]
pub(crate) struct TorStatus {
    pub bootstrap_phase: u8,
    pub is_bootstrapped: bool,
    pub network_liveness: bool,
    pub circuit_ok: bool,
}

pub(crate) struct TorControlClient {
    control_port: u16,
}

impl TorControlClient {
    pub fn new(control_port: u16) -> Self {
        Self { control_port }
    }

    pub async fn get_info(&self) -> Result<TorStatus, anyhow::Error> {
        // info!(target: LOG_TARGET, "Connecting to Tor control port {}", self.control_port);
        let stream = TcpStream::connect(format!("127.0.0.1:{}", self.control_port)).await?;
        let (reader, mut writer) = stream.into_split();
        let mut reader = BufReader::new(reader).lines();

        writer.write_all(AUTH_COMMAND.as_bytes()).await?;
        writer.flush().await?;

        if let Some(response) = reader.next_line().await? {
            if !response.starts_with("250") {
                warn!(target: LOG_TARGET, "Failed to authenticate with Tor control port: {}", response);
                return Err(anyhow::anyhow!(
                    "Failed to authenticate with Tor control port: {}",
                    response
                ));
            }
        }

        writer.write_all(BOOTSTRAP_QUERY.as_bytes()).await?;
        writer.flush().await?;

        let mut bootstrap_phase = 0;
        let mut bootstrapped = false;

        if let Some(response) = reader.next_line().await? {
            // Expected output 250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"
            let regex = Regex::new(r#"250-status\/bootstrap-phase=NOTICE\s+BOOTSTRAP\s+PROGRESS=(\d+)\s+TAG=(\w+) SUMMARY="([^"]+)""#).expect("If regex is wrong, don't start");
            if let Some(captures) = regex.captures(&response) {
                bootstrap_phase = captures
                    .get(1)
                    .ok_or_else(|| anyhow!("No progress capture in tor bootstrap status"))?
                    .as_str()
                    .parse::<u8>()?;
                bootstrapped = captures
                    .get(3)
                    .ok_or_else(|| anyhow!("No status capture in tor bootstrap status"))?
                    .as_str()
                    == "Done";
                // drop the next line
                let _s250_ok = reader.next_line().await?;
            } else {
                warn!(target: LOG_TARGET, "Failed to parse bootstrap response: {}", response);
            }
        }

        writer.write_all(CIRCUIT_QUERY.as_bytes()).await?;
        writer.flush().await?;
        let mut circuit_ok = false;
        if let Some(response) = reader.next_line().await? {
            if response.contains("circuit-established=1") {
                circuit_ok = true;
            } else {
                warn!(target: LOG_TARGET, "Circuit status not up: {}", response);
            }
            let _s250_ok = reader.next_line().await?;
        }

        writer.write_all(NETWORK_QUERY.as_bytes()).await?;
        writer.flush().await?;

        let mut network_liveness = false;
        if let Some(response) = reader.next_line().await? {
            if response.contains("network-liveness=up") {
                network_liveness = true;
            }
        }
        Ok(TorStatus {
            bootstrap_phase,
            is_bootstrapped: bootstrapped,
            network_liveness,
            circuit_ok,
        })
    }
}
