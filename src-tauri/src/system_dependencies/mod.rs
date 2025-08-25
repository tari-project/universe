use serde::{Deserialize, Serialize};

pub mod system_dependencies_manager;

#[cfg(target_os = "windows")]
mod windows;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UniversalDependencyStatus {
    Installed,
    NotInstalled,
    Unknown,
}

#[derive(Debug, Clone, Serialize)]

pub struct UniversalDependencyManufacturerUIInfo {
    pub name: String,
    pub url: String,
    pub logo_url: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct UniversalDependencyUIInfo {
    pub display_name: String,
    pub display_description: String,
    pub manufacturer: UniversalDependencyManufacturerUIInfo,
}

#[derive(Debug, Clone, Serialize)]
pub struct UniversalSystemDependency {
    pub id: String,
    pub status: UniversalDependencyStatus,
    pub download_url: String,
    pub ui_info: UniversalDependencyUIInfo,
}
