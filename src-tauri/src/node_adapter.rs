use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::network_utils::get_free_port;
use crate::node_manager::NodeIdentity;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::{process_utils, ProgressTracker};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use humantime::format_duration;
use log::{debug, info, warn};
use minotari_node_grpc_client::grpc::{
    Empty, HeightRequest, NewBlockTemplateRequest, PowAlgo, SyncState,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::ByteArray;
use tokio::select;
use tonic::transport::Channel;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

pub struct MinotariNodeAdapter {
    use_tor: bool,
    pub(crate) grpc_port: u16,
}

impl MinotariNodeAdapter {
    pub fn new(use_tor: bool) -> Self {
        let port = get_free_port().unwrap_or(18142);
        Self {
            use_tor,
            grpc_port: port,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type StatusMonitor = MinotariNodeStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
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
        ];
        if !self.use_tor {
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
        } else {
            args.push("-p".to_string());
            args.push(
                "base_node.p2p.transport.tor.listener_address_override=/ip4/0.0.0.0/tcp/18189"
                    .to_string(),
            );
        }
        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MinotariNode)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = process_utils::launch_child_process(&file_path, &args)?;

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

pub struct MinotariNodeStatusMonitor {
    grpc_port: u16,
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
    ) -> Result<(u64, u64, MicroMinotari, u64, u64, bool), Error> {
        // TODO: use GRPC port returned from process
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;

        let res = client
            .get_new_block_template(NewBlockTemplateRequest {
                algo: Some(PowAlgo { pow_algo: 1 }),
                max_weight: 0,
            })
            .await?;
        let res = res.into_inner();
        let reward = res.miner_data.unwrap().reward;

        let res = client.get_tip_info(Empty {}).await?;
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
        for i in 0..blocks.len() {
            // Unfortunately have to use 100 blocks to ensure that there are both randomx and sha blocks included
            // otherwise the hashrate is 0 for one of them.
            let res = client
                .get_network_difficulty(HeightRequest {
                    from_tip: blocks[i],
                    start_height: 0,
                    end_height: 0,
                })
                .await?;
            let mut res = res.into_inner();
            // Get the last one.
            // base node returns 0 for hashrate when the algo doesn't match, so we need to keep track of last one.
            let mut last_sha3_estimated_hashrate = 0;
            let mut last_randomx_estimated_hashrate = 0;
            while let Some(difficulty) = res.message().await? {
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

        result
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
        let mut sync_util = SyncUtil::new(SyncingType::Headers);

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
                    .update("preparing-for-initial-sync".to_string(), 10)
                    .await;
            } else if sync_progress.state == SyncState::Header as i32 {
                if sync_util.syncing_type != SyncingType::Headers {
                    sync_util = SyncUtil::new(SyncingType::Headers);
                }
                let syncing_speed = sync_util.get_syncing_speed(sync_progress.local_height);
                let blocks_behind = sync_progress.tip_height - sync_progress.local_height;
                let progress =
                    sync_util.get_progress(sync_progress.tip_height, sync_progress.local_height);

                progress_tracker
                    .update(
                        format!(
                            "Waiting for header sync. {}/{} headers synced",
                            sync_progress.local_height, sync_progress.tip_height,
                        ),
                        progress,
                    )
                    .await;
            } else if sync_progress.state == SyncState::Block as i32 {
                if sync_util.syncing_type != SyncingType::Blocks {
                    sync_util = SyncUtil::new(SyncingType::Blocks);
                }
                let syncing_speed = sync_util.get_syncing_speed(sync_progress.local_height);
                let blocks_behind = sync_progress.tip_height - sync_progress.local_height;
                let progress =
                    sync_util.get_progress(sync_progress.tip_height, sync_progress.local_height);

                progress_tracker
                    .update(
                        format!(
                            "Waiting for block sync. {}/{} Blocks synced.",
                            sync_progress.local_height, sync_progress.tip_height,
                        ),
                        progress,
                    )
                    .await;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SyncingType {
    Headers,
    Blocks,
}

pub struct SyncUtil {
    sync_progress_history: Vec<(u64, u64)>,
    syncing_type: SyncingType,
}

impl SyncUtil {
    pub fn new(syncing_type: SyncingType) -> Self {
        Self {
            sync_progress_history: vec![],
            syncing_type,
        }
    }

    fn get_syncing_speed(&mut self, local_height: u64) -> u64 {
        let time_now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        if self.sync_progress_history.len() >= 10 {
            self.sync_progress_history.remove(0);
        }

        self.sync_progress_history.push((local_height, time_now));

        let syncing_speed = self
            .sync_progress_history
            .first()
            .and_then(|first| {
                self.sync_progress_history.last().map(|last| {
                    let denominator = (last.1 - first.1) as f64;

                    if denominator != 0.0 {
                        ((last.0 as f64) - (first.0 as f64)) / denominator
                    } else {
                        0.0
                    }
                })
            })
            .unwrap_or(0.0) as u64;

        syncing_speed
    }

    fn get_progress(&self, tip_height: u64, local_height: u64) -> u64 {
        if self.syncing_type == SyncingType::Headers {
            // 10% -> 40% - Header
            if tip_height == 0 {
                10
            } else {
                10 + (30 * local_height / tip_height)
            }
        } else {
            // 40% -> 100% - Block
            if tip_height == 0 {
                40
            } else {
                40 + (60 * local_height / tip_height)
            }
        }
    }
}
