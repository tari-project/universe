// use std::{fs::OpenOptions, os::fd::IntoRawFd};

use anyhow::Error;
use async_trait::async_trait;
// use libamdgpu_top::{
//     DevicePath,
//     AMDGPU::{HwmonTemp, PowerCapType},
// };
// use libdrm_amdgpu_sys::AMDGPU::{
//     get_all_amdgpu_pci_bus, DeviceHandle, HwmonTempType, PowerCap, GPU_INFO, HW_IP::HW_IP_TYPE,
//     SENSOR_INFO::SENSOR_TYPE,
// };

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

// use adlx::{AdlxHelper, Gpu1, GpuList, GpuMetrics, GpuMetricsList, Interface};

use super::GpuParametersReader;

#[derive(Clone)]
pub struct AmdGpuReader {}

impl AmdGpuReader {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl GpuParametersReader for AmdGpuReader {
    fn get_is_reader_implemented(&self) -> bool {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => false,
            CurrentOperatingSystem::Linux => false,
            CurrentOperatingSystem::MacOS => false,
        }
    }

    async fn get_device_parameters(
        &self,
        _old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error> {
        // info!("AMD GPU reader is implemented");

        // let helper = AdlxHelper::new().inspect_err(
        //     |e| warn!("Failed to create AdlxHelper: {}", e),
        // )?;
        // info!("AdlxHelper created");
        // let system = helper.system();
        // info!("System created");
        // let gpu_list = system.gpus()?;
        // info!("GpuList created");

        // info!("GPU count: {}", gpu_list.size());

        // for gpu in 0..gpu_list.size() {
        //     let gpu = gpu_list.at(gpu)?;
        //     let gpu1 = gpu.cast::<Gpu1>()?;
        //     info!("GPU name: {}", gpu1.name()?);
        //     info!("GPU product name: {}", gpu1.product_name()?)
        // };
        // let test = get_all_amdgpu_pci_bus();

        // let mut usage_percentage = 0.0;
        // let mut current_temperature = 0.0;

        // for pci in test.iter() {
        // let render = pci.get_drm_render_path()?;
        // let fd = OpenOptions::new().read(true).write(true).open(render)?;
        // let (amdgpu,_major,_minor) = DeviceHandle::init(fd.into_raw_fd()).map_err(|e| anyhow!(e)).context("Failed to initialize AMDGPU device handle")?;
        // let usage_info = amdgpu.gtt_usage_info().ok();
        // let other_info = amdgpu.device_info().ok();
        // let another_info = amdgpu.get_gpu_metrics().ok();

        // info!("Usage info: {:?}", usage_info);
        // info!("Other info: {:?}", other_info);
        // info!("Another info: {:?}", another_info);
        // info!("Another info: {:?}", amdgpu.get_hw_ip_info(HW_IP_TYPE::COMPUTE).ok());
        // info!("Another info: {:?}", amdgpu.get_hwmon_temp(HwmonTempType::Edge));
        // info!("Another info: {:?}", amdgpu.get_hwmon_temp(HwmonTempType::Junction));
        // info!("Another info: {:?}", amdgpu.get_vbios_info().ok());
        // info!("Another info: {:?}", amdgpu.vram_usage_info().ok());
        // info!("Another info: {:?}", amdgpu.vbios_info().ok());
        // info!("Another info: {:?}", amdgpu.sensor_info(SENSOR_TYPE::GPU_LOAD).ok());
        // info!("Another info: {:?}", amdgpu.sensor_info(SENSOR_TYPE::GPU_TEMP).ok());

        //     let hwon_path = pci.get_hwmon_path().unwrap_or_default();
        //     // let s = std::fs::read_to_string(hwon_path.join("power1_input")).ok().unwrap_or_default();
        //     // let input_power_cap = s.trim_end().parse::<u32>().ok().unwrap_or_default().saturating_div(1_000_000);
        //     let power_cap = PowerCap::from_hwmon_path(&hwon_path);
        //     usage_percentage = power_cap
        //         .map(|p| p.current as f32 / p.max as f32)
        //         .unwrap_or_default();
        //     let temp_reading = HwmonTemp::from_hwmon_path(hwon_path, HwmonTempType::Edge);
        //     current_temperature = temp_reading
        //         .map(|t: HwmonTemp| t.current as f32 / 1_000.0)
        //         .unwrap_or_default();
        // }

        // let device_parameters = DeviceParameters {
        //     usage_percentage,
        //     current_temperature,
        //     max_temperature: old_device_parameters.map_or(current_temperature, |old| {
        //         old.max_temperature.max(current_temperature)
        //     }),
        // };

        let device_parameters = DeviceParameters {
            usage_percentage: 0.0,
            current_temperature: 0.0,
            max_temperature: 0.0,
        };
        Ok(device_parameters)
    }
}
