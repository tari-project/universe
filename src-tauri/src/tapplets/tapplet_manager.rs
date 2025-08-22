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

use crate::{
    events_emitter::EventsEmitter,
    requests::clients::http_file_client::HttpFileClient,
    tapplets::{
        error::{
            Error::{self, TappletServerError},
            TappletServerError::*,
        },
        server_manager::ServerManager,
        tapplet_server::{get_tapp_config, start_tapplet_server},
    },
};
use anyhow::anyhow;
use log::{info, warn};
use tauri::{AppHandle, Listener};
use tokio::sync::oneshot;

static LOG_TARGET: &str = "tari::universe::tapplet_manager";
pub struct CheckPermissionsResult {
    pub should_update: bool,
    pub updated_csp: String,
    pub updated_permissions: String,
}

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

    pub async fn emit_tapplet_notification(
        notification: String,
        app_handle: &AppHandle,
    ) -> Result<bool, anyhow::Error> {
        let response = emit_notification_dialog(notification, app_handle).await?;
        if response.to_lowercase() != "null" {
            Ok(true)
        } else {
            warn!(target: LOG_TARGET, "Tapplet's notification rejected");
            Ok(false)
        }
    }

    pub async fn check_permissions_config(
        source: &str,
        current_csp: &str,
        current_permissions: &str,
        app_handle: tauri::AppHandle,
    ) -> Result<CheckPermissionsResult, anyhow::Error> {
        let config = get_tapp_config(source).await?;
        info!(target: LOG_TARGET, "💥 Dev tapplet csp: {}", &config.csp);

        let mut updated_csp = current_csp.to_string();
        let mut updated_permissions = current_permissions.to_string();

        let mut should_update_csp = config.csp.trim_matches('"') != current_csp.trim_matches('"');
        info!(target: LOG_TARGET, "👀 SHOULD UPDATE CSP?{:?}", should_update_csp);
        if should_update_csp {
            let allowed_csp_result =
                TappletManager::allow_tapplet_csp(config.csp, &app_handle).await;
            should_update_csp = match allowed_csp_result {
                Ok(csp) => {
                    info!(target: LOG_TARGET, "💥 allowed to update {}", &csp);
                    updated_csp = csp;
                    true
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "CSP Error: {}", e);
                    false
                }
            }
        };

        let mut should_update_permissions =
            config.permissions.all_permissions_to_string() != current_permissions.trim_matches('"');
        info!(target: LOG_TARGET, "👀 SHOULD UPDATE PERMISSIONS?{:?}", should_update_permissions);
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
                    updated_permissions = p;
                    true
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Tari permissions error: {}", e);
                    false
                }
            };
        }

        Ok(CheckPermissionsResult {
            should_update: should_update_csp || should_update_permissions,
            updated_csp,
            updated_permissions,
        })
    }

    /// Wrapper to start the server and track it by tapplet_id
    pub async fn start_server(
        &self,
        tapplet_id: i32,
        tapplet_path: PathBuf,
        csp: &String,
    ) -> Result<String, Error> {
        info!(target: LOG_TARGET, "👉👉👉 Start server with manager {:?}", &tapplet_id);
        let (address, cancel_token) = start_tapplet_server(tapplet_path, csp).await?;

        self.server_manager
            .add_server(tapplet_id, address.clone(), cancel_token)
            .await;

        Ok(address)
    }

    pub async fn stop_server(&self, tapplet_id: i32) -> Result<String, Error> {
        if self.is_server_running(tapplet_id).await {
            self.server_manager
                .stop_server_by_id(tapplet_id)
                .await
                .map_err(|_| TappletServerError(FailedToStop))
        } else {
            Ok(format!("Server with id {} was not running", tapplet_id))
        }
    }
    pub async fn restart_server(
        &self,
        tapplet_id: i32,
        tapplet_path: PathBuf,
        csp: &String,
    ) -> Result<String, Error> {
        self.stop_server(tapplet_id).await?;
        self.start_server(tapplet_id, tapplet_path, csp).await
    }

    pub async fn is_server_running(&self, tapplet_id: i32) -> bool {
        let address_opt = self.server_manager.get_address(tapplet_id).await;
        match address_opt {
            Some(addr) => self.server_manager.is_running(&addr).await,
            None => false,
        }
    }

    pub async fn download_selected_version(
        &self,
        download_url: String,
        fallback_url: String,
        destination_dir: PathBuf,
    ) -> Result<PathBuf, anyhow::Error> {
        info!(target: LOG_TARGET, "Downloading tapplet from url: {}", &download_url);
        let archive_destination_path: PathBuf;

        let main_file_download_result = HttpFileClient::builder()
            // .with_cloudflare_cache_check()
            .with_file_extract()
            .with_download_resume()
            .build(download_url, destination_dir.clone())?
            .execute()
            .await
            .map_err(|e| anyhow!("Error downloading tapplet. Error: {:?}", e));

        if main_file_download_result.is_err() {
            info!(target: LOG_TARGET, "Downloading tapplet from fallback url: {}", &fallback_url);

            archive_destination_path = HttpFileClient::builder()
                .with_file_extract()
                .with_download_resume()
                .build(fallback_url, destination_dir)?
                .execute()
                .await
                .map_err(|e| {
                    anyhow!(
                        "Error downloading tapplet from fallback url. Error: {:?}",
                        e
                    )
                })?;
        } else {
            archive_destination_path = main_file_download_result?;
        }

        Ok(archive_destination_path)
    }
}

// Utils
async fn dialog_with_emitter<F, Fut>(
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
    dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_allow_tapplet_csp(csp.clone())
    })
    .await
}

async fn grant_permissions_dialog(
    permissions: String,
    app_handle: &AppHandle,
) -> Result<String, anyhow::Error> {
    dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_grant_tapplet_permissions(permissions.clone())
    })
    .await
}

async fn emit_notification_dialog(
    notification: String,
    app_handle: &AppHandle,
) -> Result<String, anyhow::Error> {
    dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_tapplet_notification(notification.clone())
    })
    .await
}
