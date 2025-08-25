use crate::system_dependencies::windows::registry::entry_cpu_hardware::WindowsRegistryCpuResolver;
use crate::system_dependencies::windows::registry::entry_gpu_drivers::WindowsRegistryGpuDriverResolver;
use crate::system_dependencies::windows::registry::entry_gpu_hardware::WindowsRegistryGpuResolver;
use crate::system_dependencies::windows::registry::entry_khronos_software::WindowsRegistryKhronosSoftwareResolver;
use crate::system_dependencies::windows::registry::entry_uninstall_software::WindowsRegistryUninstallSoftwareResolver;

pub mod entry_cpu_hardware;
pub mod entry_gpu_drivers;
pub mod entry_gpu_hardware;
pub mod entry_khronos_software;
pub mod entry_uninstall_software;

pub trait WindowsRegistryReader {
    type Entry;
    fn read_registry() -> Result<Self::Entry, anyhow::Error>;
    fn get_registry_path() -> String;
    fn get_registry_root() -> HKEY;
}
pub trait WindowsRegistryRequirementChecker {
    type Requirement;
    fn check_requirements(&self, entry: &Self::Requirement) -> bool;
}

#[derive(Clone)]
pub enum WindowsRegistryRecordType {
    // Insalled external software, checked via uninstall registry | e.g. Microsoft Visual C++ Redistributable
    UninstallSoftware,
    // Installed Khronos software, checked via Software\Khronos registry | e.g. OpenCL
    KhronosSoftware,
    // Cpu information that is present in the system, checked via CentralProcessor registry
    CpuHardware,
    // Gpu information that is present in the system, checked via CurrentControlSet\Enum\PCI registry
    GpuHardware,
    // Gpu drivers information that is present in the system, checked via CurrentControlSet\Control\Class registry
    GpuDrivers,
}
