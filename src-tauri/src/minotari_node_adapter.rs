use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::xmrig_adapter::XmrigInstance;
use anyhow::Error;
use async_trait::async_trait;
use dirs_next::{cache_dir, data_dir, data_local_dir};
use tari_shutdown::Shutdown;
use tokio::select;
use tokio::task::JoinHandle;

pub struct MinotariNodeAdapter {
    force_download: bool,
}

impl MinotariNodeAdapter {
    pub fn new() -> Self {
        Self {
            force_download: false,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type Instance = MinotariNodeInstance;
    type StatusMonitor = MinotariNodeStatusMonitor;

    fn spawn_inner(&self) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let mut shutdown_signal = inner_shutdown.to_signal();

        dbg!("STarting node");
        let working_dir = data_local_dir().unwrap().join("tari-universe").join("node");
        std::fs::create_dir_all(&working_dir)?;
        let args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string()
        ];
        dbg!(&args);
        Ok((
            MinotariNodeInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let version = BinaryResolver::current()
                        .ensure_latest(Binaries::MinotariNode)
                        .await?;

                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MinotariNode, &version)?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(
                       file_path
                    )
                    .args(args)
                    // .stdout(std::process::Stdio::piped())
                    // .stderr(std::process::Stdio::piped())
                    .kill_on_drop(true)
                    .spawn()?;

                    select! {
                        res = shutdown_signal =>{
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

pub struct MinotariNodeStatusMonitor {}

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

impl StatusMonitor for MinotariNodeStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}
