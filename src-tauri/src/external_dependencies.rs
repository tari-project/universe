use anyhow::{anyhow, Error};
use std::sync::LazyLock;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;

const LOG_TARGET: &str = "tari::universe::external_dependencies";
static INSTANCE: LazyLock<ExternalDependencies> = LazyLock::new(ExternalDependencies::new);

#[derive(Debug)]
struct InstalledApplication {
    display_name: String,
    display_version: String,
}

pub struct ExternalDependencies {}

impl ExternalDependencies {
    fn new() -> Self {
        Self {}
    }

    fn read_installed_applications(&self) -> Result<Vec<InstalledApplication>, Error> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let uninstall_key =
            hklm.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall").map_err(|e| {
                anyhow!("Error opening uninstall key: {}", e);
            })?;
        let mut installed_applications = Vec::new();
        for key in uninstall_key.enum_keys() {
            match key {
                Ok(key) => {
                    let app_key = uninstall_key.open_subkey(&key).map_err(|e| {
                        warn!("Could not open application key: {}", e);
                    })?;
                    let display_name: String = app_key.get_value("DisplayName").ok();
                    let display_version: String = app_key.get_value("DisplayVersion").ok();

                    if let (Some(display_name), Some(display_version)) = (display_name, display_version) {
                        installed_applications.push(InstalledApplication {
                            display_name,
                            display_version,
                        });
                    } 
                }
                Err(e) => {
                    warn!("Error enumerating uninstall keys: {}", e);
                }
            }
        }
        info!(target: LOG_TARGET, "Installed applications: {:?}", installed_applications);
        Ok(installed_applications)
    }

    pub fn detect_installed_applications(&self) -> Result<(), Error> {
        self.read_installed_applications()?;
        Ok(())
    }

    pub fn current() -> &'static ExternalDependencies {
        &INSTANCE
    }
}
