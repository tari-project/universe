use log::info;

const LOG_TARGET: &str = "tari::universe::cpu_miner";

pub(crate) struct GpuMiner {}

impl GpuMiner {
    pub fn new() -> Self {
        Self {}
    }

    pub fn start(&mut self) {
        info!(target: LOG_TARGET, "Starting GPU miner");
        // Start the GPU miner
    }

    pub fn stop(&mut self) {
        info!(target: LOG_TARGET, "Stopping GPU miner");
        // Stop the GPU miner
    }

    pub fn status(&mut self) {}
}
