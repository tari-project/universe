use log::info;
use nvml_wrapper::{
    enum_wrappers::device::{TemperatureSensor, TemperatureThreshold},
    Nvml,
};

use crate::{GpuMinerHardwareStatus, GpuMinerStatus};

const LOG_TARGET: &str = "tari::universe::cpu_miner";

pub(crate) struct GpuMiner {
    nvml: Option<Nvml>,
    status: GpuMinerStatus,
}

impl GpuMiner {
    pub fn new() -> Self {
        Self {
            nvml: GpuMiner::try_to_initialize_nvml(),
            status: GpuMinerStatus::from(GpuMinerStatus {
                hardware_statuses: Vec::new(),
            }),
        }
    }

    fn try_to_initialize_nvml() -> Option<Nvml> {
        let nvml = Nvml::init();

         match nvml {
            Ok(nvml) => {
                info!(target: LOG_TARGET, "NVML initialized");
                Some(nvml)
            },
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to initialize NVML: {}", e);
                None
            }
        }
    }

    pub fn start(&mut self) {
        info!(target: LOG_TARGET, "Starting GPU miner");
        // Start the GPU miner
    }

    pub fn stop(&mut self) {
        info!(target: LOG_TARGET, "Stopping GPU miner");
        // Stop the GPU miner
    }

    pub fn status(&mut self) -> GpuMinerStatus {

        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                self.nvml = GpuMiner::try_to_initialize_nvml();
                self.status.hardware_statuses = Vec::new();
                return self.status.clone();
            }
        };

        if self.status.hardware_statuses.is_empty() {
            let devices_count = nvml.device_count().unwrap();

            for i in 0..devices_count {
                let device = nvml.device_by_index(i).unwrap();

                let uuid = device.uuid().unwrap();
                let name = device.name().unwrap();
                let temperature = device.temperature(TemperatureSensor::Gpu).unwrap();
                let load = device.utilization_rates().unwrap().gpu;

                self.status.hardware_statuses.push(GpuMinerHardwareStatus {
                    uuid,
                    name,
                    temperature,
                    max_temperature: temperature,
                    load,
                });
            }
        }

        self.status.hardware_statuses = self
            .status
            .hardware_statuses
            .iter()
            .map(|status| {
                let device = nvml.device_by_uuid(status.uuid.clone()).unwrap();

                let temperature = device.temperature(TemperatureSensor::Gpu).unwrap();
                let load = device.utilization_rates().unwrap().gpu;
                let max_temperature = status.max_temperature.max(temperature);

                GpuMinerHardwareStatus {
                    uuid: status.uuid.clone(),
                    name: status.name.clone(),
                    temperature,
                    max_temperature,
                    load,
                }
            })
            .collect();

        self.status.clone()
    }
}
