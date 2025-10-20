// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use winreg::HKEY;

pub mod entry_cpu_hardware;
pub mod entry_gpu_drivers;
pub mod entry_gpu_hardware;
pub mod entry_khronos_software;
pub mod entry_uninstall_software;
pub mod entry_tasktray_icon;

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
    // Task tray icon information that is present in the system, checked via Control Panel\NotifyIconSettings
    TaskTrayIcon,
}
