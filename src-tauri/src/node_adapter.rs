use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::network_utils::get_free_port;
use crate::node_manager::NodeIdentity;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::{process_utils, ProgressTracker};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{debug, info, warn};
use minotari_node_grpc_client::grpc::{
    Empty, HeightRequest, NewBlockTemplateRequest, PowAlgo, SyncState,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::ByteArray;
use tokio::select;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

pub(crate) struct MinotariNodeAdapter {
    use_tor: bool,
    pub(crate) grpc_port: u16,
    pub(crate) use_pruned_mode: bool,
    required_initial_peers: u32,
}

impl MinotariNodeAdapter {
    pub fn new(use_tor: bool) -> Self {
        let port = get_free_port().unwrap_or(18142);
        Self {
            use_tor,
            grpc_port: port,
            use_pruned_mode: false,
            required_initial_peers: 3,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type StatusMonitor = MinotariNodeStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir = data_dir.join("node");
        std::fs::create_dir_all(&working_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            format!("--log-path={}", log_dir.to_str().unwrap()).to_string(),
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
            "base_node.p2p.auxiliary_tcp_listener_address=/ip4/0.0.0.0/tcp/9998".to_string(),
            "-p".to_string(),
            format!(
                "base_node.state_machine.initial_sync_peer_count={}",
                self.required_initial_peers
            ),
        ];
        if self.use_pruned_mode {
            args.push("-p".to_string());
            args.push("base_node.storage.pruning_horizon=100".to_string());
        }
        // if cfg!(debug_assertions) {
        //     args.push("--network".to_string());
        //     args.push("localnet".to_string());
        // }
        if self.use_tor {
            args.push("-p".to_string());
            args.push(
                "base_node.p2p.transport.tor.listener_address_override=/ip4/0.0.0.0/tcp/18189"
                    .to_string(),
            );
        } else {
            // TODO: This is a bit of a hack. You have to specify a public address for the node to bind to.
            // In future we should change the base node to not error if it is tcp and doesn't have a public address
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            // args.push("-p".to_string());
            // args.push("base_node.p2p.allow_test_addresses=true".to_string());
            args.push("-p".to_string());
            // args.push("base_node.p2p.public_addresses=/ip4/127.0.0.1/tcp/18189".to_string());
            args.push("base_node.p2p.public_addresses=/ip4/172.2.3.4/tcp/18189".to_string());
            // args.push("base_node.p2p.allow_test_addresses=true".to_string());
            // args.push("-p".to_string());
            // args.push("base_node.p2p.public_addresses=/ip4/127.0.0.1/tcp/18189".to_string());
            // args.push("-p".to_string());
            // args.push(
            //     "base_node.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/18189".to_string(),
            // );
        }
        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MinotariNode)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = process_utils::launch_child_process(&file_path, None, &args)?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("node_pid"), id.to_string())?;
                    }

                    let exit_code;
                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            exit_code = 0;
                            // res
                        },
                        res2 = child.wait() => {
                            match res2
                             {
                                Ok(res) => {
                                    exit_code = res.code().unwrap_or(0)
                                    },
                                Err(e) => {
                                    warn!(target: LOG_TARGET, "Error in NodeInstance: {}", e);
                                    return Err(e.into());
                                }
                            }

                        },
                    }

                    match fs::remove_file(data_dir.join("node_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear node's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
            },
            MinotariNodeStatusMonitor {
                grpc_port: self.grpc_port,
                required_sync_peers: self.required_initial_peers,
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

pub struct MinotariNodeStatusMonitor {
    grpc_port: u16,
    required_sync_peers: u32,
}

#[async_trait]
impl StatusMonitor for MinotariNodeStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
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
        let reward = res.miner_data.unwrap().reward;

        let res = client
            .get_tip_info(Empty {})
            .await
            .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
        let res = res.into_inner();
        let (sync_achieved, block_height, _hash, block_time) = (
            res.initial_sync_achieved,
            res.metadata.as_ref().unwrap().best_block_height,
            res.metadata.as_ref().unwrap().best_block_hash.clone(),
            res.metadata.unwrap().timestamp,
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

        loop {
            let tip = client.get_tip_info(Empty {}).await?;
            let sync_progress = client.get_sync_progress(Empty {}).await?;
            let tip_res = tip.into_inner();
            let sync_progress = sync_progress.into_inner();
            if tip_res.initial_sync_achieved {
                break;
            }
            info!(target: LOG_TARGET, "Sync progress: {:?}", sync_progress);

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
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        Ok(())
    }
}
