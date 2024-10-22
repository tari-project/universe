use crate::network_utils::get_free_port;
use crate::node_manager::NodeIdentity;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::utils::file_utils::convert_to_string;
use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::info;
use minotari_node_grpc_client::grpc::{
    Empty, HeightRequest, NewBlockTemplateRequest, Peer, PowAlgo, SyncState,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use std::collections::HashMap;
use std::path::PathBuf;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tari_utilities::ByteArray;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

pub(crate) struct MinotariNodeAdapter {
    pub(crate) use_tor: bool,
    pub(crate) grpc_port: u16,
    pub(crate) tcp_listener_port: u16,
    pub(crate) use_pruned_mode: bool,
    pub(crate) tor_control_port: Option<u16>,
    required_initial_peers: u32,
}

impl MinotariNodeAdapter {
    pub fn new() -> Self {
        let port = get_free_port().unwrap_or(18142);
        let tcp_listener_port = get_free_port().unwrap_or(18189);
        Self {
            grpc_port: port,
            tcp_listener_port,
            use_pruned_mode: false,
            required_initial_peers: 3,
            use_tor: false,
            tor_control_port: None,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type StatusMonitor = MinotariNodeStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let status_shutdown = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir: PathBuf = data_dir.join("node");
        std::fs::create_dir_all(&working_dir)?;

        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir_string,
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            format!("--log-path={}", log_dir_string),
            "-p".to_string(),
            "base_node.grpc_enabled=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.grpc_address=/ip4/127.0.0.1/tcp/{}",
                self.grpc_port
            ),
            "-p".to_string(),
            "base_node.report_grpc_error=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.state_machine.initial_sync_peer_count={}",
                self.required_initial_peers
            ),
            "-p".to_string(),
            "base_node.grpc_server_allow_methods=\"list_connected_peers\"".to_string(),
            "-p".to_string(),
            "base_node.p2p.allow_test_addresses=true".to_string(),
        ];
        if self.use_pruned_mode {
            args.push("-p".to_string());
            args.push("base_node.storage.pruning_horizon=100".to_string());
        }
        // Uncomment to test winning blocks
        // if cfg!(debug_assertions) {
        // args.push("--network".to_string());
        // args.push("localnet".to_string());
        // }
        if self.use_tor {
            // args.push("-p".to_string());
            // args.push(
            //     "base_node.p2p.transport.tor.listener_address_override=/ip4/127.0.0.1/tcp/18189"
            //         .to_string(),
            // );
            if cfg!(target_os = "windows") {
                // No need
            } else {
                args.push("-p".to_string());
                args.push("use_libtor=false".to_string());
            }
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.auxiliary_tcp_listener_address=/ip4/0.0.0.0/tcp/{0}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string());
            if let Some(tor_control_port) = self.tor_control_port {
                args.push("-p".to_string());
                args.push(format!(
                    "base_node.p2p.transport.tor.control_address=/ip4/127.0.0.1/tcp/{}",
                    tor_control_port
                ));
            }
        } else {
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.transport.tcp.listener_address=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));
            // args.push("-p".to_string());
            // args.push(
            // "base_node.p2p.dht.excluded_dial_addresses=/ip4/127.*.*.*/tcp/0:18188".to_string(),
            // );
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            MinotariNodeStatusMonitor {
                grpc_port: self.grpc_port,
                required_sync_peers: self.required_initial_peers,
                shutdown_signal: status_shutdown,
            },
        ))
    }

    fn name(&self) -> &str {
        "minotari_node"
    }

    fn pid_file_name(&self) -> &str {
        "node_pid"
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MinotariNodeStatusMonitorError {
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Node not started")]
    NodeNotStarted,
}

#[derive(Clone)]
pub struct MinotariNodeStatusMonitor {
    grpc_port: u16,
    required_sync_peers: u32,
    shutdown_signal: ShutdownSignal,
}

#[async_trait]
impl StatusMonitor for MinotariNodeStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        if self.get_identity().await.is_ok() {
            HealthStatus::Healthy
        } else {
            HealthStatus::Unhealthy
        }
    }
}

impl MinotariNodeStatusMonitor {
    pub async fn get_network_hash_rate_and_block_reward(
        &self,
    ) -> Result<(u64, u64, MicroMinotari, u64, u64, bool), MinotariNodeStatusMonitorError> {
        // TODO: use GRPC port returned from process
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port))
                .await
                .map_err(|_| MinotariNodeStatusMonitorError::NodeNotStarted)?;

        let res = client
            .get_new_block_template(NewBlockTemplateRequest {
                algo: Some(PowAlgo { pow_algo: 1 }),
                max_weight: 0,
            })
            .await
            .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
        let res = res.into_inner();

        let reward = res
            .miner_data
            .ok_or_else(|| {
                MinotariNodeStatusMonitorError::UnknownError(anyhow!("No miner data found"))
            })?
            .reward;

        let res = client
            .get_tip_info(Empty {})
            .await
            .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
        let res = res.into_inner();
        let metadata = match res.metadata {
            Some(metadata) => metadata,
            None => {
                return Err(MinotariNodeStatusMonitorError::UnknownError(anyhow!(
                    "No metadata found"
                )));
            }
        };
        let (sync_achieved, block_height, _hash, block_time) = (
            res.initial_sync_achieved,
            metadata.best_block_height,
            metadata.best_block_hash.clone(),
            metadata.timestamp,
        );
        // First try with 10 blocks
        let blocks = [10, 100];
        let mut result = Err(anyhow::anyhow!("No difficulty found"));
        for block in &blocks {
            // Unfortunately have to use 100 blocks to ensure that there are both randomx and sha blocks included
            // otherwise the hashrate is 0 for one of them.
            let res = client
                .get_network_difficulty(HeightRequest {
                    from_tip: *block,
                    start_height: 0,
                    end_height: 0,
                })
                .await
                .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
            let mut res = res.into_inner();
            // Get the last one.
            // base node returns 0 for hashrate when the algo doesn't match, so we need to keep track of last one.
            let mut last_sha3_estimated_hashrate = 0;
            let mut last_randomx_estimated_hashrate = 0;
            while let Some(difficulty) = res
                .message()
                .await
                .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?
            {
                if difficulty.sha3x_estimated_hash_rate != 0 {
                    last_sha3_estimated_hashrate = difficulty.sha3x_estimated_hash_rate;
                }
                if difficulty.randomx_estimated_hash_rate != 0 {
                    last_randomx_estimated_hashrate = difficulty.randomx_estimated_hash_rate;
                }

                result = Ok((
                    last_sha3_estimated_hashrate,
                    last_randomx_estimated_hashrate,
                    MicroMinotari(reward),
                    block_height,
                    block_time,
                    sync_achieved,
                ));
            }
            if last_randomx_estimated_hashrate != 0 && last_sha3_estimated_hashrate != 0 {
                break;
            }
        }

        Ok(result?)
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;

        let id = client.identify(Empty {}).await?;
        let res = id.into_inner();

        Ok(NodeIdentity {
            public_key: RistrettoPublicKey::from_canonical_bytes(&res.public_key)
                .map_err(|e| anyhow!(e.to_string()))?,
        })
    }

    pub async fn wait_synced(&self, progress_tracker: ProgressTracker) -> Result<(), Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;

        let mut last_state: Option<i32> = None;
        loop {
            if self.shutdown_signal.is_triggered() {
                break;
            }
            let tip = client.get_tip_info(Empty {}).await?;
            let sync_progress = client.get_sync_progress(Empty {}).await?;
            let tip_res = tip.into_inner();
            let sync_progress = sync_progress.into_inner();
            if tip_res.initial_sync_achieved {
                break;
            }

            let current_state = sync_progress.state;
            if last_state.is_none() || last_state != Some(current_state) {
                last_state = Some(current_state);
                if sync_progress.state == SyncState::Startup as i32 {
                    progress_tracker
                        .update(
                            "preparing-for-initial-sync".to_string(),
                            Some(HashMap::from([
                                (
                                    "initial_connected_peers".to_string(),
                                    sync_progress.initial_connected_peers.to_string(),
                                ),
                                (
                                    "required_peers".to_string(),
                                    self.required_sync_peers.to_string(),
                                ),
                            ])),
                            10,
                        )
                        .await;
                } else if sync_progress.state == SyncState::Header as i32 {
                    let progress = if sync_progress.tip_height == 0 {
                        10
                    } else {
                        10 + (30 * sync_progress.local_height / sync_progress.tip_height)
                    };

                    progress_tracker
                        .update(
                            "waiting-for-header-sync".to_string(),
                            Some(HashMap::from([
                                (
                                    "local_height".to_string(),
                                    sync_progress.local_height.to_string(),
                                ),
                                (
                                    "tip_height".to_string(),
                                    sync_progress.tip_height.to_string(),
                                ),
                            ])),
                            progress,
                        )
                        .await;
                } else if sync_progress.state == SyncState::Block as i32 {
                    let progress = if sync_progress.tip_height == 0 {
                        40
                    } else {
                        40 + (60 * sync_progress.local_height / sync_progress.tip_height)
                    };

                    progress_tracker
                        .update(
                            "waiting-for-block-sync".to_string(),
                            Some(HashMap::from([
                                (
                                    "local_height".to_string(),
                                    sync_progress.local_height.to_string(),
                                ),
                                (
                                    "tip_height".to_string(),
                                    sync_progress.tip_height.to_string(),
                                ),
                            ])),
                            progress,
                        )
                        .await;
                } else {
                    //do nothing
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        Ok(())
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<Peer>, Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;
        let connected_peers = client.list_connected_peers(Empty {}).await?;
        Ok(connected_peers.into_inner().connected_peers)
    }
}
