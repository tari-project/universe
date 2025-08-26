use std::sync::LazyLock;

#[cfg(target_os = "windows")]
use anyhow::anyhow;
use anyhow::Error;

#[cfg(target_os = "windows")]
use crate::events_emitter::EventsEmitter;
#[cfg(target_os = "windows")]
use crate::system_dependencies::windows::resolver::WindowsDependenciesResolver;
#[cfg(target_os = "windows")]
use crate::system_dependencies::UniversalDependencyStatus;
use crate::system_dependencies::UniversalSystemDependency;
#[cfg(target_os = "windows")]
use crate::tasks_tracker::TasksTrackers;

#[allow(dead_code)]
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

    #[allow(dead_code)]
    pub async fn validate_dependencies(&self, with_shutdown: bool) -> Result<(), Error> {
        #[cfg(target_os = "windows")]
        {
            let dependencies = self
                .windows_dependencies_resolver
                .validate_dependencies()
                .await?;

            EventsEmitter::emit_system_dependencies_loaded(dependencies.clone()).await;
            if dependencies
                .iter()
                .any(|d| d.status != UniversalDependencyStatus::Installed)
            {
                if with_shutdown {
                    TasksTrackers::current().stop_all_processes().await;
                }

                return Err(anyhow!("Some system dependencies are missing"));
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _unused = with_shutdown;
            // No validation needed on non-Windows platforms
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn get_universal_dependencies(
        &self,
    ) -> Result<Vec<UniversalSystemDependency>, Error> {
        #[cfg(target_os = "windows")]
        {
            self.windows_dependencies_resolver
                .get_universal_dependencies()
                .await
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(vec![])
        }
    }

    #[allow(dead_code)]
    pub async fn is_some_dependency_invalid(&self) -> Result<bool, Error> {
        #[cfg(target_os = "windows")]
        {
            Ok(self
                .windows_dependencies_resolver
                .get_universal_dependencies()
                .await?
                .iter()
                .any(|d| d.status != UniversalDependencyStatus::Installed))
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(false)
        }
    }

    #[allow(dead_code)]
    pub async fn download_and_install_missing_dependencies(&self, id: String) -> Result<(), Error> {
        #[cfg(target_os = "windows")]
        {
            self.windows_dependencies_resolver
                .download_and_install_missing_dependencies(id)
                .await?;

            EventsEmitter::emit_system_dependencies_loaded(
                self.get_universal_dependencies().await?,
            )
            .await;
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _unused = id; // Suppress unused variable warning
        }

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub fn get_windows_dependencies_resolver(&self) -> &WindowsDependenciesResolver {
        &self.windows_dependencies_resolver
    }

    pub fn get_instance() -> &'static Self {
        &INSTANCE
    }
}
