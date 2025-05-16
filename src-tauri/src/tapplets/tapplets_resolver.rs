// Copyright 2024. The Tari Project
//
// Redistribution and use in source and tapplet forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in tapplet form must reproduce the above copyright notice, this list of conditions and the
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

use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::error;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::Receiver;
use tokio::sync::{Mutex, RwLock};
use tokio::time::timeout;

use super::bridge_adapter::BridgeTappletAdapter;
use super::tapp_consts::TAPPLET_SOURCE_DIR;
use super::tapplets_manager::TappletManager;
use super::Tapplets;

static INSTANCE: LazyLock<RwLock<TappletResolver>> =
    LazyLock::new(|| RwLock::new(TappletResolver::new()));

#[async_trait]
pub trait TappletApiAdapter: Send + Sync + 'static {
    fn get_tapplet_source_file(&self) -> Result<PathBuf, Error>;
    fn get_tapplet_dest_dir(&self) -> Result<PathBuf, Error>;
}

pub struct TappletResolver {
    managers: HashMap<Tapplets, Mutex<TappletManager>>,
}

impl TappletResolver {
    #[allow(clippy::too_many_lines)]
    pub fn new() -> Self {
        let mut tapplet_manager = HashMap::<Tapplets, Mutex<TappletManager>>::new();

        tapplet_manager.insert(
            Tapplets::Bridge,
            Mutex::new(TappletManager::new(
                Tapplets::Bridge.name().to_string(),
                Box::new(BridgeTappletAdapter {}),
            )),
        );

        Self {
            managers: tapplet_manager,
        }
    }

    pub fn current() -> &'static RwLock<TappletResolver> {
        &INSTANCE
    }

    pub async fn resolve_path_to_tapplet_dest_dir(
        &self,
        tapplet: Tapplets,
    ) -> Result<PathBuf, Error> {
        let manager = self
            .managers
            .get(&tapplet)
            .ok_or_else(|| anyhow!("No latest version manager for this tapplet"))?;

        let dest_dir = manager.lock().await.get_dest_dir().map_err(|error| {
            anyhow!(
                "No dest directory for tapplet {}, Error: {}",
                tapplet.name(),
                error
            )
        })?;

        // should return /.cache/com.tari.universe.alpha/tapplets/bridge/<network>/out
        Ok(dest_dir.join(TAPPLET_SOURCE_DIR))
    }

    pub async fn initialize_tapplet_timeout(
        &self,
        tapplet: Tapplets,
        progress_tracker: ProgressTracker,
        timeout_channel: Receiver<String>,
    ) -> Result<(), Error> {
        match timeout(
            Duration::from_secs(60 * 5),
            self.initialize_tapplet(tapplet, progress_tracker.clone()),
        )
        .await
        {
            Err(_) => {
                let last_msg = timeout_channel.borrow().clone();
                error!(target: "tari::universe::main", "Setup took too long: {:?}", last_msg);
                let error_msg = format!("Setup took too long: {}", last_msg);
                sentry::capture_message(&error_msg, sentry::Level::Error);
                Err(anyhow!(error_msg))
            }
            Ok(result) => result,
        }
    }

    pub async fn initialize_tapplet(
        &self,
        tapplet: Tapplets,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let manager = self
            .managers
            .get(&tapplet)
            .ok_or_else(|| anyhow!("Couldn't find manager for tapplet: {}", tapplet.name()))?
            .lock()
            .await;

        manager.extract_tapplet(progress_tracker).await?;

        Ok(())
    }
}
