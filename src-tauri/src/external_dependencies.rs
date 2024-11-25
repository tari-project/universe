use anyhow::{anyhow, Error};
use futures_util::StreamExt;
use log::info;
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::LazyLock;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;
#[cfg(target_os = "windows")]
use winreg::enums::HKEY_LOCAL_MACHINE;
#[cfg(target_os = "windows")]
use winreg::RegKey;

#[allow(dead_code)]
const LOG_TARGET: &str = "tari::universe::external_dependencies";
static INSTANCE: LazyLock<ExternalDependencies> = LazyLock::new(ExternalDependencies::new);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ExternalDependencyStatus {
    Installed,
    NotInstalled,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manufacturer {
    pub name: String,
    pub logo: String,
    pub url: String,
}

impl Manufacturer {
    pub fn new(name: String, url: String, logo: String) -> Self {
        Self { name, url, logo }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalDependency {
    required_version_names: Vec<String>,
    display_name: String,
    display_description: String,
    download_url: String,
    version: Option<String>,
    manufacturer: Manufacturer,
    status: ExternalDependencyStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequiredExternalDependency {
    pub additional_runtime: ExternalDependency,
    pub minimum_runtime: ExternalDependency,
}

#[cfg(target_os = "windows")]
#[derive(Debug, Clone)]
pub struct RegistryEntry {
    display_name: String,
    display_version: String,
}

pub struct ExternalDependencies {
    external_dependencies: RwLock<RequiredExternalDependency>,
}

impl ExternalDependencies {
    fn new() -> Self {
        Self {
            external_dependencies: RwLock::new(Self::initialize_required_installed_applications()),
        }
    }

    fn initialize_required_installed_applications() -> RequiredExternalDependency {
        if cfg!(target_arch = "x86") {
            RequiredExternalDependency {
                additional_runtime: ExternalDependency {
                    required_version_names: vec![
                        "Microsoft Visual C++ 2022 x86 Additional Runtime".to_string(),
                        "Microsoft Visual C++ 2019 x86 Additional Runtime".to_string(),
                    ],
                    display_name: "Microsoft Visual C++ 2022 x86 Additional Runtime".to_string(),
                    display_description:
                        "This is the additional runtime required to run Tari applications."
                            .to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                    manufacturer: Manufacturer::new(
                        "Microsoft".to_string(),
                        "https://www.microsoft.com".to_string(),
                        "https://www.microsoft.com/favicon.ico".to_string(),
                    ),
                    status: ExternalDependencyStatus::Unknown,
                    version: None,
                },
                minimum_runtime: ExternalDependency {
                    required_version_names: vec![
                        "Microsoft Visual C++ 2022 x86 Minimum Runtime".to_string(),
                        "Microsoft Visual C++ 2019 x86 Minimum Runtime".to_string(),
                    ],
                    display_name: "Microsoft Visual C++ 2022 x86 Minimum Runtime".to_string(),
                    display_description:
                        "This is the minimum runtime required to run Tari applications.".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                    manufacturer: Manufacturer::new(
                        "Microsoft".to_string(),
                        "https://www.microsoft.com".to_string(),
                        "https://www.microsoft.com/favicon.ico".to_string(),
                    ),
                    status: ExternalDependencyStatus::Unknown,
                    version: None,
                },
            }
        } else {
            RequiredExternalDependency {
                additional_runtime: ExternalDependency {
                    required_version_names: vec![
                        "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                        "Microsoft Visual C++ 2019 x64 Additional Runtime".to_string(),
                    ],
                    display_name: "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                    display_description:
                        "This is the additional runtime required to run Tari applications."
                            .to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                    manufacturer: Manufacturer::new(
                        "Microsoft".to_string(),
                        "https://www.microsoft.com".to_string(),
                        "https://www.microsoft.com/favicon.ico".to_string(),
                    ),
                    status: ExternalDependencyStatus::Unknown,
                    version: None,
                },
                minimum_runtime: ExternalDependency {
                    required_version_names: vec![
                        "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                        "Microsoft Visual C++ 2019 x64 Minimum Runtime".to_string(),
                    ],
                    display_name: "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                    display_description:
                        "This is the minimum runtime required to run Tari applications.".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                    manufacturer: Manufacturer::new(
                        "Microsoft".to_string(),
                        "https://www.microsoft.com".to_string(),
                        "https://www.microsoft.com/favicon.ico".to_string(),
                    ),
                    status: ExternalDependencyStatus::Unknown,
                    version: None,
                },
            }
        }
    }

    #[cfg(target_os = "windows")]
    async fn check_status_of_external_dependency(&self, registry_entries: Vec<RegistryEntry>) {
        let mut external_dependencies = self.external_dependencies.write().await;
        registry_entries.iter().for_each(|app| {
            if external_dependencies
                .additional_runtime
                .required_version_names
                .iter()
                .any(|required_app_name| {
                    app.display_name
                        .to_lowercase()
                        .as_str()
                        .contains(required_app_name.to_lowercase().as_str())
                })
            {
                info!(target: LOG_TARGET, "Found installed additional runtime: {}", app.display_name);
                external_dependencies.additional_runtime.status =
                    ExternalDependencyStatus::Installed;
                external_dependencies.additional_runtime.version =
                    Some(app.display_version.clone());
            }

            if external_dependencies
                .minimum_runtime
                .required_version_names
                .iter()
                .any(|required_app_name| {
                    app.display_name
                        .to_lowercase()
                        .as_str()
                        .contains(required_app_name.to_lowercase().as_str())
                })
            {
                info!(target: LOG_TARGET, "Found installed minimum runtime: {}", app.display_name);
                external_dependencies.minimum_runtime.status = ExternalDependencyStatus::Installed;
                external_dependencies.minimum_runtime.version = Some(app.display_version.clone());
            }
        });

        if external_dependencies.additional_runtime.status == ExternalDependencyStatus::Unknown {
            info!(target: LOG_TARGET, "Additional runtime not found");
            external_dependencies.additional_runtime.status =
                ExternalDependencyStatus::NotInstalled;
        }

        if external_dependencies.minimum_runtime.status == ExternalDependencyStatus::Unknown {
            info!(target: LOG_TARGET, "Minimum runtime not found");
            external_dependencies.minimum_runtime.status = ExternalDependencyStatus::NotInstalled;
        }
    }

    #[cfg(target_os = "windows")]
    pub async fn read_registry_installed_applications(&self) -> Result<Vec<RegistryEntry>, Error> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let uninstall_key = hklm
            .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
            .map_err(|e| anyhow!("Error opening uninstall key: {}", e))?;
        let mut registry_application_entry = Vec::new();
        for key in uninstall_key.enum_keys() {
            match key {
                Ok(key) => {
                    let app_key = match uninstall_key.open_subkey(&key) {
                        Ok(app_key) => app_key,
                        Err(e) => {
                            log::warn!(target: LOG_TARGET, "Error opening uninstall key: {}", e);
                            continue;
                        }
                    };
                    let display_name = app_key.get_value("DisplayName").ok();
                    let display_version = app_key.get_value("DisplayVersion").ok();

                    if let (Some(display_name), Some(display_version)) =
                        (display_name, display_version)
                    {
                        registry_application_entry.push(RegistryEntry {
                            display_name,
                            display_version,
                        });
                    }
                }
                Err(e) => {
                    log::warn!(target: LOG_TARGET, "Error enumerating uninstall keys: {}", e);
                }
            }
        }

        self.check_status_of_external_dependency(registry_application_entry.clone())
            .await;

        Ok(registry_application_entry)
    }

    pub async fn get_external_dependencies(&self) -> RequiredExternalDependency {
        self.external_dependencies.read().await.clone()
    }

    #[allow(dead_code)]
    pub async fn check_if_some_dependency_is_not_installed(&self) -> bool {
        let registry_application_entry = self.get_external_dependencies().await;

        registry_application_entry.additional_runtime.status
            == ExternalDependencyStatus::NotInstalled
            || registry_application_entry.minimum_runtime.status
                == ExternalDependencyStatus::NotInstalled
    }

    #[allow(dead_code)]
    async fn download_installer(&self, app: &ExternalDependency) -> Result<String, Error> {
        info!(target: LOG_TARGET, "Downloading installer for {}", app.display_name);
        let response = reqwest::get(&app.download_url).await?;
        if response.status() != 200 {
            return Err(anyhow!(
                "Failed to download installer for {}: {}",
                app.display_name,
                response.status()
            ));
        }
        info!(target: LOG_TARGET, "Installer downloaded for {}", app.display_name);
        let installer_path = format!("{}/{}", env::temp_dir().to_string_lossy(), app.display_name);
        let mut dest = File::create(installer_path.clone()).await?;
        let mut stream = response.bytes_stream();
        while let Some(item) = stream.next().await {
            dest.write_all(&item?).await?;
        }
        info!(target: LOG_TARGET, "Writing installer to {}", installer_path.clone());
        Ok(installer_path.clone())
    }

    #[allow(dead_code)]
    pub async fn install_missing_dependencies(
        &self,
        missing_dependency: ExternalDependency,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Installing missing dependency: {}", missing_dependency.display_name);
        let installer_path = self.download_installer(&missing_dependency).await?;

        #[cfg(target_os = "windows")]
        use crate::consts::PROCESS_CREATION_NO_WINDOW;
        #[cfg(target_os = "windows")]
        let mut thread = tokio::process::Command::new(installer_path)
            .creation_flags(PROCESS_CREATION_NO_WINDOW)
            .spawn()
            .map_err(|e| {
                anyhow!(
                    "Failed to start installer for {}: {}",
                    missing_dependency.display_name,
                    e
                )
            })?;

        #[cfg(not(target_os = "windows"))]
        let mut thread = tokio::process::Command::new(installer_path)
            .spawn()
            .map_err(|e| {
                anyhow!(
                    "Failed to start installer for {}: {}",
                    missing_dependency.display_name,
                    e
                )
            })?;

        thread.wait().await?;

        #[cfg(target_os = "windows")]
        {
            self.read_registry_installed_applications().await?;
        }

        Ok(())
    }

    pub fn current() -> &'static ExternalDependencies {
        &INSTANCE
    }
}
