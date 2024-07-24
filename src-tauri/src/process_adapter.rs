use tokio::sync::mpsc::Receiver;
use async_trait::async_trait;

pub trait ProcessAdapter<TInstance: ProcessInstance> {
    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn(&self) -> Result<TInstance, anyhow::Error>;
    fn name(&self) -> &str;
}

#[async_trait]
pub trait ProcessInstance : Send + Sync + 'static {
    fn ping(&self) -> bool;
    async fn stop(&self) -> Result<(), anyhow::Error>;
}