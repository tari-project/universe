use anyhow::{anyhow, Error, Ok};
use log::{info, warn};
use tokio::sync::RwLock;
use std::sync::LazyLock;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;
use reqwest::Client;

const LOG_TARGET: &str = "tari::universe::external_dependencies";
static INSTANCE: LazyLock<ExternalDependencies> = LazyLock::new(ExternalDependencies::new);

#[derive(Debug)]
struct InstalledApplication {
    display_names: Vec<String>,
    download_name: String,
    download_url: String,
}

#[derive(Debug)]
struct RequiredInstalledApplications {
    additional_runtime: InstalledApplication,
    minimum_runtime: InstalledApplication,
}

#[derive(Debug)]
struct RegistryEntry {
    display_name: String,
    display_version: String,
}

pub struct ExternalDependencies {
    required_installed_applications: RequiredInstalledApplications,
    missing_applications: RwLock<Vec<InstalledApplication>>,
}

impl ExternalDependencies {
    fn new() -> Self {
        Self {
            required_installed_applications: Self::initialize_required_installed_applications(),
            missing_applications: RwLock::new(Vec::new()),
        }
    }

    fn initialize_required_installed_applications() -> RequiredInstalledApplications {
        if cfg!(target_arch = "x86") {
            RequiredInstalledApplications {
                additional_runtime: InstalledApplication {
                    display_names: vec![
                        "Microsoft Visual C++ 2019 x86 Additional Runtime".to_string(),
                        "Microsoft Visual C++ 2022 x86 Additional Runtime".to_string(),
                    ],
                    download_name: "Microsoft Visual C++ 2022 x86 Additional Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                },
                minimum_runtime: InstalledApplication {
                    display_names: vec![
                        "Microsoft Visual C++ 2019 x86 Minimum Runtime".to_string(),
                        "Microsoft Visual C++ 2022 x86 Minimum Runtime".to_string(),
                    ],
                    download_name: "Microsoft Visual C++ 2022 x86 Minimum Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                },
            }
        } else {
            RequiredInstalledApplications {
                additional_runtime: InstalledApplication {
                    display_names: vec![
                        "Microsoft Visual C++ 2019 x64 Additional Runtime".to_string(),
                        "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                    ],
                    download_name: "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                },
                minimum_runtime: InstalledApplication {
                    display_names: vec![
                        "Microsoft Visual C++ 2019 x64 Minimum Runtime".to_string(),
                        "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                    ],
                    download_name: "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                },
            }
        }
    }

    fn read_installed_applications(&self) -> Result<Vec<RegistryEntry>, Error> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let uninstall_key = hklm
            .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
            .map_err(|e| anyhow!("Error opening uninstall key: {}", e))?;
        let mut installed_applications = Vec::new();
        for key in uninstall_key.enum_keys() {
            match key {
                Ok(key) => {
                    let app_key = match uninstall_key.open_subkey(&key) {
                        Ok(app_key) => app_key,
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Error opening uninstall key: {}", e);
                            continue;
                        }
                    };
                    let display_name = app_key.get_value("DisplayName").ok();
                    let display_version = app_key.get_value("DisplayVersion").ok();

                    if let (Some(display_name), Some(display_version)) =
                        (display_name, display_version)
                    {
                        installed_applications.push(RegistryEntry {
                            display_name,
                            display_version,
                        });
                    }
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Error enumerating uninstall keys: {}", e);
                }
            }
        }

        installed_applications.iter().for_each(|app| {
            info!(target: LOG_TARGET, "Installed application: {} {}", app.display_name, app.display_version);
        });

        Ok(installed_applications)
    }

    pub async fn check_if_required_installed_applications_are_installed(&self) -> Result<Vec<InstalledApplication>, Error> {
        let installed_applications = self.read_installed_applications()?;
        let mut missing_applications = Vec::new();

        if !installed_applications.iter().any(|app| {
            self.required_installed_applications
                .additional_runtime
                .display_names
                .iter()
                .any(|required_app_name| {
                    app.display_name
                        .to_lowercase()
                        .as_str()
                        .contains(required_app_name.to_lowercase().as_str())
                })
        }) {
            missing_applications.push(&self.required_installed_applications.additional_runtime);
        }

        if !installed_applications.iter().any(|app| {
            self.required_installed_applications
                .minimum_runtime
                .display_names
                .iter()
                .any(|required_app_name| {
                    app.display_name
                        .to_lowercase()
                        .as_str()
                        .contains(required_app_name.to_lowercase().as_str())
                })
        }) {
            missing_applications.push(&self.required_installed_applications.minimum_runtime);
        }

        self.missing_applications.write().await.extend(missing_applications);
        Ok(missing_applications)
    }

    pub async fn get_missing_applications(&self) -> Vec<InstalledApplication> {
        self.missing_applications.read().await.clone()
    }

    async fn download_installer(&self, client: &Client, app: &InstalledApplication) -> Result<String, Error> {
        let response = client.get(&app.download_url).send().await?;
        if response.status() != 200 {
            return Err(anyhow!(
                "Failed to download installer for {}: {}",
                app.download_name,
                response.status()
            ));
        }
        let data = response.bytes().await?;
        let installer_path = format!("C:\\temp\\{}", app.download_name);
        tokio::fs::write(installer_path, data).await?;
        Ok(installer_path)
    }

    pub async fn install_missing_applications(&self) -> Result<(), Error> {
        let missing_applications = self.get_missing_applications().await;
        let client = Client::new();
        for app in missing_applications {
            let installer_path = self.download_installer(&client, &app).await?;
            tokio::process::Command::new(installer_path)
                .spawn()
                .map_err(|e| anyhow!("Failed to start installer for {}: {}", app.download_name, e))?;
        }
        Ok(())
    }

    pub fn current() -> &'static ExternalDependencies {
        &INSTANCE
    }
}
