use tari_shutdown::ShutdownSignal;
use tauri::api::process::{Command, CommandEvent};
use tokio::select;
use tokio::sync::mpsc::Receiver;
use tokio::time::MissedTickBehavior;
use crate::process_watcher::ProcessWatcher;
use crate::sidecar_adapter::{MergeMiningProxyInstance, SidecarAdapter};

pub struct MmProxyManager {
    process_events: Option<Receiver<CommandEvent>>
}

impl MmProxyManager {
    pub fn new() -> Self {
        Self {

                process_events: None
        }
    }


    pub async fn start(&mut self, app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        if self.process_events.is_some() {
            println!("Tried to start mining twice");
            return Ok(());
        }

        // let (mut rx, mut child)  = Command::new_sidecar("minotari_merge_mining_proxy")?.spawn()?;
        let sidecar_adapter = SidecarAdapter::<MergeMiningProxyInstance>::new("minotari_merge_mining_proxy".to_string());
        let mut process_watcher = ProcessWatcher::new(sidecar_adapter);
        process_watcher.start(app_shutdown).await?;
        todo!()

    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        // I'm ready when the http health service says so
        todo!()
    }

    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        todo!()
    }
}