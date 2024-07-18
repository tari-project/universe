use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::api::process::{Command};
use tauri::async_runtime::JoinHandle;
use tokio::select;

pub(crate) struct CpuMiner {

    watcher_task : Option<JoinHandle<()>>,
    miner_shutdown: Shutdown
}

impl CpuMiner {
    pub fn new() -> Self {
        Self {
            watcher_task: None,
            miner_shutdown: Shutdown::new(),
        }
    }

    pub fn start(&mut self, mut app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        if self.watcher_task.is_some() {
            println!("Tried to start mining twice");
            return Ok(());
        }
        let mut inner_shutdown = self.miner_shutdown.to_signal();

        let (mut rx, mut child) = Command::new_sidecar("minotari_node")
            .expect("failed to create `minotari_node` binary command")
            .spawn()
            .expect("Failed to spawn sidecar");

        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            println!("Starting process");
            // read events such as stdout
            loop {
               select! {

                      event = rx.recv() => {
                        if let Some(event) = event {

                      // if let CommandEvent::Stdout(line) = event {
                      //    window
                      //   .emit("message", Some(format!("'{}'", line)))
                      //   .expect("failed to emit event");
                    // write to stdin
                    //child.write("message from Rust\n".as_bytes()).unwrap();

                       }
                    else {
                     break;
                    }
                       },

                _ = inner_shutdown.wait() => {
                    child.kill().expect("Failed to kill child process");
                    break;
                },
                _ = app_shutdown.wait() => {
    child.kill().expect("Failed to kill child process");
                    break;
                }
            }

        }}));
            Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.miner_shutdown.trigger();
        if let Some(task) = self.watcher_task.take() {
            task.await?;
        }
        Ok(())
    }
}