use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::node_manager::NodeIdentity;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::xmrig_adapter::XmrigInstance;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use dirs_next::data_local_dir;
use log::info;
use minotari_node_grpc_client::grpc::{
    Empty, GetHeaderByHashRequest, HeightRequest, NewBlockTemplateRequest, PowAlgo,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use std::path::PathBuf;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::ByteArray;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;
use tokio::time::Instant;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

pub struct MinotariNodeAdapter {
    force_download: bool,
    use_tor: bool,
}

impl MinotariNodeAdapter {
    pub fn new(use_tor: bool) -> Self {
        Self {
            force_download: false,
            use_tor,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type Instance = MinotariNodeInstance;
    type StatusMonitor = MinotariNodeStatusMonitor;

    fn spawn_inner(
        &self,
        _log_path: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir = data_local_dir().unwrap().join("tari-universe").join("node");
        std::fs::create_dir_all(&working_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            // "-p\"base_node.grpc_server_allow_methods\"=get_network_difficulty".to_string(),
        ];
        if !self.use_tor {
            // TODO: This is a bit of a hack. You have to specify a public address for the node to bind to.
            // In future we should change the base node to not error if it is tcp and doesn't have a public address
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push("base_node.p2p.public_addresses=/ip4/172.2.3.4/tcp/18189".to_string());
            args.push("-p".to_string());
            // args.push(
            //     "base_node.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/18189".to_string(),
            // );
            args.push("-p".to_string());
            args.push(
                "base_node.p2p.auxiliary_tcp_listener_address=/ip4/0.0.0.0/tcp/9998".to_string(),
            );
        } else {
            args.push("-p".to_string());
            args.push(
                "base_node.p2p.transport.tor.listener_address_override=/ip4/0.0.0.0/tcp/18189"
                    .to_string(),
            );
        }
        dbg!(&args);
        Ok((
            MinotariNodeInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let version = BinaryResolver::current()
                        .ensure_latest(Binaries::MinotariNode)
                        .await?;

                    let file_path =
                        BinaryResolver::current().resolve_path(Binaries::MinotariNode, &version)?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        // .stdout(std::process::Stdio::piped())
                        // .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            // res
                        },
                        res2 = child.wait() => {
                            dbg!("Exited badly:", res2?);
                        },
                    };
                    println!("Stopping minotari node");

                    // child.kill().await?;
                    // let out = child.wait_with_output().await?;
                    // println!("stdout: {}", String::from_utf8_lossy(&out.stdout));
                    Ok(())
                })),
            },
            MinotariNodeStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "minotari_node"
    }
}

pub struct MinotariNodeInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

#[async_trait]
impl ProcessInstance for MinotariNodeInstance {
    fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    async fn stop(&mut self) -> Result<(), Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        let res = handle.unwrap().await??;
        Ok(res)
    }
}

impl Drop for MinotariNodeInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                handle.await.unwrap();
            });
        }
    }
}
pub struct MinotariNodeStatusMonitor {}

impl StatusMonitor for MinotariNodeStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}

impl MinotariNodeStatusMonitor {
    pub async fn get_network_hash_rate_and_block_reward(
        &self,
    ) -> Result<(u64, u64, MicroMinotari, u64, u64, bool), Error> {
        // TODO: use GRPC port returned from process
        let mut client = BaseNodeGrpcClient::connect("http://127.0.0.1:18142").await?;
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
        let (sync_achieved, block_height, hash, block_time) = (
            res.initial_sync_achieved,
            res.metadata.as_ref().unwrap().best_block_height,
            res.metadata.as_ref().unwrap().best_block_hash.clone(),
            res.metadata.unwrap().timestamp,
        );
        let res = client
            .get_network_difficulty(HeightRequest {
                from_tip: 1,
                start_height: 0,
                end_height: 0,
            })
            .await?;
        let mut res = res.into_inner();
        while let Some(difficulty) = res.message().await? {
            return Ok((
                difficulty.sha3x_estimated_hash_rate,
                difficulty.randomx_estimated_hash_rate,
                MicroMinotari(reward),
                block_height,
                block_time,
                sync_achieved,
            ));
        }
        // Really unlikely to arrive here
        Err(anyhow::anyhow!("No difficulty found"))
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, Error> {
        let mut client = BaseNodeGrpcClient::connect("http://127.0.0.1:18142").await?;
        let id = client.identify(Empty {}).await?;
        let res = id.into_inner();
        dbg!(&res);

        Ok(NodeIdentity {
            public_key: RistrettoPublicKey::from_canonical_bytes(&res.public_key)
                .map_err(|e| anyhow!(e.to_string()))?,
            public_addresses: res.public_addresses,
        })
    }
}
