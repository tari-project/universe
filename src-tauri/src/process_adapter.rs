use async_trait::async_trait;

pub trait ProcessAdapter {
    type Instance: ProcessInstance;
    type StatusMonitor: StatusMonitor;
    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(&self) -> Result<(Self::Instance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(&self) -> Result<Self::Instance, anyhow::Error> {
        let (instance, _) = self.spawn_inner()?;
        Ok(instance)
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
