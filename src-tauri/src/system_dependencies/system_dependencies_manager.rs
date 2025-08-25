use std::sync::LazyLock;

use anyhow::Error;

#[cfg(target_os = "windows")]
use crate::system_dependencies::windows::resolver::WindowsDependenciesResolver;
use crate::system_dependencies::UniversalSystemDependency;

const LOG_TARGET: &str = "tari::universe::system_dependencies::manager";
static INSTANCE: LazyLock<SystemDependenciesManager> =
    LazyLock::new(SystemDependenciesManager::new);

pub struct SystemDependenciesManager {
    #[cfg(target_os = "windows")]
    windows_dependencies_resolver: WindowsDependenciesResolver,
}

impl SystemDependenciesManager {
    pub fn new() -> Self {
        Self {
            #[cfg(target_os = "windows")]
            windows_dependencies_resolver: WindowsDependenciesResolver::new(),
        }
    }

    pub async fn validate_dependencies(&self) -> Result<Vec<UniversalSystemDependency>, Error> {
        #[cfg(not(target_os = "windows"))]
        {
            return Ok(vec![]);
        }

        self.windows_dependencies_resolver
            .validate_dependencies()
            .await
    }

    pub async fn is_some_dependency_invalid(&self) -> Result<bool, Error> {
        #[cfg(not(target_os = "windows"))]
        {
            return Ok(false);
        }

        self.windows_dependencies_resolver
            .get_universal_dependencies()
            .await
            .iter()
            .any(|d| d.status != DependencyStatus::Installed)
    }

    pub async fn download_and_install_missing_dependencies(&self, id: String) -> Result<(), Error> {
        #[cfg(not(any(target_os = "windows")))]
        {
            return Ok(());
        }

        self.windows_dependencies_resolver
            .download_and_install_missing_dependencies(id)
            .await
    }

    #[cfg(target_os = "windows")]
    pub fn get_windows_dependencies_resolver(&self) -> &WindowsDependenciesResolver {
        &self.windows_dependencies_resolver
    }

    pub fn get_instance() -> &'static Self {
        &INSTANCE
    }
}
