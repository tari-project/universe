use std::path::PathBuf;
use async_trait::async_trait;

pub trait ProcessAdapter {
    type Instance: ProcessInstance;
    type StatusMonitor: StatusMonitor;
    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(&self, base_folder: PathBuf) -> Result<(Self::Instance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(&self, base_folder:PathBuf) -> Result<(Self::Instance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(base_folder)
    }
}

pub trait StatusMonitor {
    fn status(&self) -> Result<(), anyhow::Error>;
}

#[async_trait]
pub trait ProcessInstance: Send + Sync + 'static {
    fn ping(&self) -> bool;
    async fn stop(&mut self) -> Result<(), anyhow::Error>;
}
