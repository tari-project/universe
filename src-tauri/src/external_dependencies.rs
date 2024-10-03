use anyhow::{anyhow, Error};
use std::sync::LazyLock;
use log::{info, warn};
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;

const LOG_TARGET: &str = "tari::universe::external_dependencies";
static INSTANCE: LazyLock<ExternalDependencies> = LazyLock::new(ExternalDependencies::new);

#[derive(Debug)]
struct InstalledApplication {
    display_name: String,
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
}

impl ExternalDependencies {
    fn new() -> Self {
        Self {
            required_installed_applications: Self::initialize_required_installed_applications(),
        }
    }

    fn initialize_required_installed_applications() -> RequiredInstalledApplications {
        if cfg!(target_arch = "x86") {
            RequiredInstalledApplications {
                additional_runtime: InstalledApplication {
                    display_name: "Microsoft Visual C++ 2022 x86 Additional Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                },
                minimum_runtime: InstalledApplication {
                    display_name: "Microsoft Visual C++ 2022 x86 Minimum Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x86.exe".to_string(),
                },
            }
        } else {
            RequiredInstalledApplications {
                additional_runtime: InstalledApplication {
                    display_name: "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                },
                minimum_runtime: InstalledApplication {
                    display_name: "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                    download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
                },
            }
        }
    }

    fn read_installed_applications(&self) -> Result<Vec<RegistryEntry>, Error> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let uninstall_key =
            hklm.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall").map_err(|e| {
                anyhow!("Error opening uninstall key: {}", e)
            })?;
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

                    if let (Some(display_name), Some(display_version)) = (display_name, display_version) {
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

    pub fn check_if_required_installed_applications_are_installed(&self) -> Result<(), Error> {
        let installed_applications = self.read_installed_applications()?;
        let mut missing_applications = Vec::new();

        if !installed_applications.iter().any(|app| app.display_name.contains(self.required_installed_applications.additional_runtime.display_name.as_str())) {
            missing_applications.push(&self.required_installed_applications.additional_runtime);
        }

        if !installed_applications.iter().any(|app| app.display_name.contains(self.required_installed_applications.minimum_runtime.display_name.as_str())) {
            missing_applications.push(&self.required_installed_applications.minimum_runtime);
        }

        if !missing_applications.is_empty() {
            return Err(anyhow!(
                "The following required applications are not installed:\r\n\r\n{}",
                missing_applications.iter().map(|app| format!("{} | Download url: {}", app.display_name, app.download_url)).collect::<Vec<String>>().join("\r\n")
            ));
        }
        Ok(())
    }

    pub fn current() -> &'static ExternalDependencies {
        &INSTANCE
    }
}
