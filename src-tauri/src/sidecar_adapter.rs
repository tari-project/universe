use std::marker::PhantomData;
use std::mem::offset_of;
use anyhow::Error;
use async_trait::async_trait;
use tokio::sync::mpsc::Receiver;
use crate::process_adapter::{ProcessAdapter, ProcessInstance};

pub struct SidecarAdapter<TSidecarInstance: ProcessInstance> {
    marker: PhantomData<TSidecarInstance>,
    name: String
}

impl<TSidecarInstance: ProcessInstance> SidecarAdapter<TSidecarInstance> {
    pub fn new(name: String) -> Self {
        Self {
            marker: PhantomData::default(),
            name
        }
    }
}



impl<TSidecarInstance: ProcessInstance> ProcessAdapter<TSidecarInstance> for SidecarAdapter<TSidecarInstance> {
    fn spawn(&self) -> Result<(Receiver<()>, TSidecarInstance), anyhow::Error> {
        todo!()
    }

    fn name(&self) -> &str {
        self.name.as_str()
    }
}

pub struct MergeMiningProxyInstance {
    // pub listening_port: u16
}

#[async_trait]
impl ProcessInstance for MergeMiningProxyInstance {
    fn ping(&self) -> bool {
        todo!()
    }

    async fn stop(&self) -> Result<(), Error> {
        todo!()
    }
    // pub fn listening_port(&self) -> u16 {
    //     self.listening_port
    // }
}