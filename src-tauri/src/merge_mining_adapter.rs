use anyhow::Error;
use async_trait::async_trait;
use dirs_next::{cache_dir, data_dir, data_local_dir};
use tari_shutdown::Shutdown;
use tokio::task::JoinHandle;
use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::xmrig_adapter::XmrigInstance;

pub struct MergeMiningProxyAdapter {
    force_download: bool,
}

impl MergeMiningProxyAdapter {
    pub fn new() -> Self {
        Self {
            force_download: false,
        }
    }

}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type Instance = MergeMiningProxyInstance;
    type StatusMonitor = MergeMiningProxyStatusMonitor;

    fn spawn_inner(&self) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let mut shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_local_dir().unwrap().join("tari-universe").join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;
        let args : Vec::<String> = vec!["-b".to_string(), working_dir.to_str().unwrap().to_string(),
        "--non-interactive-mode".to_string()];
        dbg!(&args);
        Ok((
        MergeMiningProxyInstance {
            shutdown: inner_shutdown,
            handle: Some(tokio::spawn(async move {
                let version =  BinaryResolver::current().ensure_latest(Binaries::MergeMiningProxy).await?;

                let mut child = tokio::process::Command::new(BinaryResolver::current().resolve_path(Binaries::MergeMiningProxy, &version)?)
                    .args(args)
                    .stdout(std::process::Stdio::piped())
                    .stderr(std::process::Stdio::piped())
                    .kill_on_drop(true)
                    .spawn()?;


                shutdown_signal.wait().await;
                println!("Stopping mmproxy");

                child.kill().await?;
                let out = child.wait_with_output().await?;
                println!("stdout: {}", String::from_utf8_lossy(&out.stdout));
                Ok(())
            }))
        }, MergeMiningProxyStatusMonitor {}))
    }

    fn name(&self) -> &str {
        "minotari_merge_mining_proxy"
    }
}

pub struct MergeMiningProxyInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

pub struct MergeMiningProxyStatusMonitor {

}


#[async_trait]
impl ProcessInstance for MergeMiningProxyInstance {
    fn ping(&self) -> bool {
        self
            .handle
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

impl StatusMonitor for MergeMiningProxyStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}