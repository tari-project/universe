use std::marker::PhantomData;
use anyhow::Error;
use async_trait::async_trait;
use tauri::api::process::{Command, CommandChild};
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





// impl<TSidecarInstance: ProcessInstance> ProcessAdapter<TSidecarInstance> for SidecarAdapter<TSidecarInstance> {
//     fn spawn(&self) -> Result<TSidecarInstance, Error> {
//         // implemented in more specific trait impl's
//         todo!()
//     }
//
//     fn name(&self) -> &str {
//         self.name.as_str()
//     }
// }

impl ProcessAdapter<MergeMiningProxyInstance> for SidecarAdapter<MergeMiningProxyInstance> {
    fn spawn(&self) -> Result<MergeMiningProxyInstance, anyhow::Error> {
        let (mut rx, child) = Command::new_sidecar(self.name())?.spawn()?;

        // while let Some(event) = rx.recv().await {
        //     match event {
        //         CommandEvent::Terminated()
        //         _ => {
        //             println!("{}: {}", self.name(), event);
                // }
            // }
        // }

        Ok(MergeMiningProxyInstance{ command_child: child, has_terminated: false})
    }

    fn name(&self) -> &str {
        self.name.as_str()
    }
}

pub struct MergeMiningProxyInstance {
    // pub listening_port: u16
    command_child: CommandChild,
    has_terminated: bool
}

#[async_trait]
impl ProcessInstance for MergeMiningProxyInstance {
    fn ping(&self) -> bool {
        // TODO: Actual code
        !self.has_terminated
    }

    async fn stop(&self) -> Result<(), Error> {
        todo!()
    }
    // pub fn listening_port(&self) -> u16 {
    //     self.listening_port
    // }
}