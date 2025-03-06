use std::sync::LazyLock;

use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};

static INSTANCE: LazyLock<FrontendReadyChannel> = LazyLock::new(FrontendReadyChannel::new);

#[derive(Debug)]
pub struct FrontendReadyChannel {
    pub sender: Sender<bool>,
    pub receiver: Mutex<Receiver<bool>>,
}

impl FrontendReadyChannel {
    pub fn new() -> Self {
        let (sender, receiver) = tokio::sync::watch::channel(false);
        Self {
            sender,
            receiver: Mutex::new(receiver),
        }
    }

    pub fn set_ready(&self) {
        self.sender.send(true).unwrap();
    }

    pub async fn wait_for_ready(&self) -> Result<(), tokio::sync::watch::error::RecvError> {
        let mut receiver = self.receiver.lock().await;
        receiver.wait_for(|value| *value).await?;
        Ok(())
    }

    pub fn current() -> &'static FrontendReadyChannel {
        &INSTANCE
    }
}
