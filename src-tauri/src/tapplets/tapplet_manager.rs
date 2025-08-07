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

use std::path::PathBuf;

use log::{info, warn};
use tauri::{AppHandle, Listener};
use tokio::sync::oneshot;

use crate::{
    database::models::{DevTapplet, UpdateDevTapplet},
    events_emitter::EventsEmitter,
    tapplets::{
        error::Error,
        server_manager::ServerManager,
        tapplet_server::{get_tapplet_config, start_tapplet_server},
    },
};

static LOG_TARGET: &str = "tari::universe::tapplet_manager";

pub(crate) struct TappletManager {
    server_manager: ServerManager,
}
impl Clone for TappletManager {
    fn clone(&self) -> Self {
        Self {
            server_manager: self.server_manager.clone(),
        }
    }
}
impl TappletManager {
    pub fn new() -> Self {
        Self {
            server_manager: ServerManager::new(),
        }
    }
    pub async fn allow_tapplet_csp(
        csp: String,
        app_handle: &AppHandle,
    ) -> Result<String, anyhow::Error> {
        let allowed_csp = allow_csp_dialog(csp, app_handle).await?;
        if allowed_csp.to_lowercase() != "null" {
            info!(target: LOG_TARGET, "💭 Tapplet's CSP accepted. CSP: {:?}", &allowed_csp);
            Ok(allowed_csp)
        } else {
            warn!(target: LOG_TARGET, "Tapplet's CSP was not accepted (null)");
            Err(anyhow::anyhow!("Tapplet's CSP was not accepted"))
        }
    }
    pub async fn grant_tapplet_permissions(
        permissions: String,
        app_handle: &AppHandle,
    ) -> Result<String, anyhow::Error> {
        let granted_permissions = grant_permissions_dialog(permissions, app_handle).await?;
        if granted_permissions.to_lowercase() != "null" {
            info!(target: LOG_TARGET, "💭 Tapplet's permissions granted: {:?}", &granted_permissions);
            Ok(granted_permissions)
        } else {
            warn!(target: LOG_TARGET, "Tapplet's permissions were not granted (null)");
            Err(anyhow::anyhow!("Tapplet's permissions were not granted"))
        }
    }
    pub async fn check_permissions_config(
        tapplet: &DevTapplet,
        app_handle: tauri::AppHandle,
    ) -> Result<(bool, UpdateDevTapplet), anyhow::Error> {
        let tapp_path = PathBuf::from(&tapplet.endpoint);
        let config = get_tapplet_config(&tapp_path).unwrap_or_default();
        info!(target: LOG_TARGET, "💥 Dev tapplet csp: {}", &config.csp);

        let mut updated_dev_tapp = UpdateDevTapplet::from(tapplet);

        let mut should_update_csp = config.csp.trim_matches('"') != tapplet.csp.trim_matches('"');
        info!(target: LOG_TARGET, "👀 SHOULD UPDATE CSP?{:?}", should_update_csp);
        if should_update_csp {
            let allowed_csp_result =
                TappletManager::allow_tapplet_csp(config.csp, &app_handle).await;
            should_update_csp = match allowed_csp_result {
                Ok(csp) => {
                    updated_dev_tapp.csp = csp.clone();
                    info!(target: LOG_TARGET, "💥 allowed to update {}", &csp);
                    true
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Tapplet's CSP was not accepted: {}", e);
                    false
                }
            }
        };

        let mut should_update_permissions = config.permissions.all_permissions_to_string()
            != tapplet.tari_permissions.trim_matches('"');
        info!(target: LOG_TARGET, "👀 SHOULD UPDATE PERMISSIONS?{:?}", should_update_permissions);
        info!(target: LOG_TARGET, "👀 PERMISSIONS CONFIG {:?}", config.permissions.all_permissions_to_string());
        info!(target: LOG_TARGET, "👀 PERMISSIONS TAPPLE {:?}",tapplet.tari_permissions.trim_matches('"'));
        if should_update_permissions {
            let granted_permissions = TappletManager::grant_tapplet_permissions(
                config.permissions.all_permissions_to_string(),
                &app_handle,
            )
            .await
            .map_err(|e| e.to_string());
            info!(target: LOG_TARGET, "💥 Grant permissions result: {:?}", granted_permissions);

            should_update_permissions = match granted_permissions {
                Ok(p) => {
                    updated_dev_tapp.tari_permissions = p.clone();
                    true
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Tapplet's CSP was not accepted: {}", e);
                    false
                }
            };
        }

        return Ok((
            should_update_csp || should_update_permissions,
            updated_dev_tapp,
        ));
    }

    /// Wrapper to start the server and track it by tapplet_id
    pub async fn start_server(
        &self,
        tapplet_id: i32,
        tapplet_path: PathBuf,
        csp: &String,
    ) -> Result<String, Error> {
        // Pass tapplet_id to the start_and_register function
        // start_and_register_tapplet_server(tapplet_id, tapplet_path, csp, &self.server_manager).await
        info!(target: LOG_TARGET, "👉👉👉 Start server with manager {:?}", &tapplet_id);
        let (address, cancel_token) = start_tapplet_server(tapplet_path, csp).await?;

        self.server_manager
            .add_server(tapplet_id, address.clone(), cancel_token)
            .await;

        Ok(address)
    }

    /// Stops a server gracefully by its tapplet_id
    pub async fn stop_server(&self, tapplet_id: i32) -> Result<String, String> {
        self.server_manager.stop_server_by_id(tapplet_id).await
    }
    /// Check if tapplet server is running by tapplet_id
    pub async fn is_server_running(&self, tapplet_id: i32) -> bool {
        let address_opt = self.server_manager.get_address(tapplet_id).await;
        match address_opt {
            Some(addr) => self.server_manager.is_running(&addr).await,
            None => false,
        }
    }
}

// Utils
async fn csp_dialog_with_emitter<F, Fut>(
    app_handle: &AppHandle,
    emit_fn: F,
) -> Result<String, anyhow::Error>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    // Display the CSP dialog using the provided emitter
    emit_fn().await;

    // Listen for the CSP dialog response event
    let (tx, rx) = oneshot::channel();
    app_handle.once("tapplet-dialog-response", move |event| {
        let response = event.payload().trim();

        if response.is_empty() {
            let _ = tx.send(None);
        } else {
            let _ = tx.send(Some(response.to_string()));
        }
    });

    let response = rx.await.unwrap_or_default();
    if let Some(response_str) = response {
        log::info!("📩 RESPONSE RECEIVED {:?}", &response_str);
        Ok(response_str)
    } else {
        log::info!("Granting tapplet permissions failed");
        Err(anyhow::anyhow!("Granting tapplet permissions failed"))
    }
}

async fn allow_csp_dialog(csp: String, app_handle: &AppHandle) -> Result<String, anyhow::Error> {
    csp_dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_allow_tapplet_csp(csp.clone())
    })
    .await
}

async fn grant_permissions_dialog(
    permissions: String,
    app_handle: &AppHandle,
) -> Result<String, anyhow::Error> {
    csp_dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_grant_tapplet_permissions(permissions.clone())
    })
    .await
}
