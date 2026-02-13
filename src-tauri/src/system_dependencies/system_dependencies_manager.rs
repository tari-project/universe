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

use std::sync::LazyLock;

use anyhow::Error;
#[cfg(target_os = "windows")]
use anyhow::anyhow;

#[cfg(target_os = "windows")]
use crate::events_emitter::EventsEmitter;
#[cfg(target_os = "windows")]
use crate::system_dependencies::UniversalDependencyStatus;
use crate::system_dependencies::UniversalSystemDependency;
#[cfg(target_os = "windows")]
use crate::system_dependencies::windows::resolver::WindowsDependenciesResolver;
#[cfg(target_os = "windows")]
use crate::tasks_tracker::TasksTrackers;

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
    pub async fn validate_dependencies(&self) -> Result<bool, Error> {
        #[cfg(target_os = "windows")]
        {
            let dependencies = self
                .windows_dependencies_resolver
                .validate_dependencies()
                .await?;

            EventsEmitter::emit_system_dependencies_loaded(dependencies.clone()).await;
            let is_valid = !dependencies
                .iter()
                .any(|d| d.status != UniversalDependencyStatus::Installed);
            return Ok(is_valid);
        }

        Ok(true)
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
