use std::sync::{Arc};
use tari_shutdown::ShutdownSignal;
use tauri::api::process::{Command, CommandEvent};
use tokio::select;
use tokio::sync::mpsc::Receiver;
use tokio::sync::RwLock;
use tokio::time::MissedTickBehavior;
use crate::process_watcher::ProcessWatcher;
use crate::sidecar_adapter::{MergeMiningProxyInstance, SidecarAdapter};

pub struct MmProxyManager {
    watcher: Arc<RwLock<ProcessWatcher<SidecarAdapter<MergeMiningProxyInstance>, MergeMiningProxyInstance>>>
}

impl MmProxyManager {
    pub fn new() -> Self {
        let sidecar_adapter = SidecarAdapter::<MergeMiningProxyInstance>::new("minotari_merge_mining_proxy".to_string());
        let process_watcher = ProcessWatcher::new(sidecar_adapter);

        Self {
watcher: Arc::new(RwLock::new(process_watcher))

        }
    }


    pub async fn start(&self, app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {

        // let (mut rx, mut child)  = Command::new_sidecar("minotari_merge_mining_proxy")?.spawn()?;
        // let sidecar_adapter = SidecarAdapter::<MergeMiningProxyInstance>::new("minotari_merge_mining_proxy".to_string());
        let mut process_watcher = self.watcher.write().await;
        process_watcher.start(app_shutdown).await?;

        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        // I'm ready when the http health service says so
        self.watcher.read().await.wait_ready().await?;
        Ok(())
    }

    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        // todo!()
        Ok(0)
    }
}