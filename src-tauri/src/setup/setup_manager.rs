use std::{
    collections::HashMap,
    sync::{LazyLock, Mutex},
};

use anyhow::{Error, Ok};
use log::info;

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<Mutex<SetupManager>> = LazyLock::new(|| Mutex::new(SetupManager::new()));

#[derive(Clone, PartialEq, Eq, Hash)]
pub enum SetupPhase {
    Core,
    Wallet,
    Hardware,
    LocalNode,
    RemoteNode,
}
pub struct SetupManager {
    phase_statuses: HashMap<SetupPhase, bool>,
}

impl SetupManager {
    pub fn new() -> Self {
        let mut phase_statuses: HashMap<SetupPhase, bool> = HashMap::new();
        phase_statuses.insert(SetupPhase::Core, false);
        phase_statuses.insert(SetupPhase::Wallet, false);
        phase_statuses.insert(SetupPhase::Hardware, false);
        phase_statuses.insert(SetupPhase::LocalNode, false);
        phase_statuses.insert(SetupPhase::RemoteNode, false);
        Self { phase_statuses }
    }

    pub fn get_instance() -> &'static LazyLock<Mutex<SetupManager>> {
        &INSTANCE
    }

    pub fn start_setup(&self) {
        todo!()
    }

    pub fn spawn_first_batch_of_setup_phases(&self) {
        todo!()
    }

    pub fn spawn_second_batch_of_setup_phases(&self) {
        todo!()
    }

    pub fn set_phase_status(&mut self, phase: SetupPhase, status: bool) {
        self.phase_statuses.insert(phase, status);
        //Todo: handle phase status update
        let _unused = self.handle_phase_status_update(&self.phase_statuses);
    }

    fn unlock_app(&self) {
        todo!()
    }

    fn unlock_wallet(&self) {
        todo!()
    }

    fn unlock_mining(&self) {
        todo!()
    }

    fn handle_phase_status_update(
        &self,
        phases_statuses: &HashMap<SetupPhase, bool>,
    ) -> Result<(), Error> {
        let core_phase_status = *phases_statuses.get(&SetupPhase::Core).unwrap_or(&false);
        let wallet_phase_status = *phases_statuses.get(&SetupPhase::Wallet).unwrap_or(&false);
        let hardware_phase_status = *phases_statuses.get(&SetupPhase::Hardware).unwrap_or(&false);
        let local_node_phase_status = *phases_statuses
            .get(&SetupPhase::LocalNode)
            .unwrap_or(&false);
        let remote_node_phase_status = *phases_statuses
            .get(&SetupPhase::RemoteNode)
            .unwrap_or(&false);

        if core_phase_status {
            info!(target: LOG_TARGET, "Unlocking app");
            self.unlock_app();
        };

        if core_phase_status
            && wallet_phase_status
            && (local_node_phase_status || remote_node_phase_status)
        {
            info!(target: LOG_TARGET, "Unlocking wallet");
            self.unlock_wallet();
        };

        if core_phase_status
            && wallet_phase_status
            && hardware_phase_status
            && (local_node_phase_status || remote_node_phase_status)
        {
            info!(target: LOG_TARGET, "Unlocking mining");
            self.unlock_mining();
        };

        Ok(())
    }
}
