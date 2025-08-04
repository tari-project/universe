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

use log::info;
use tauri::{AppHandle, Listener};
use tokio::sync::oneshot;

use crate::events_emitter::EventsEmitter;

static LOG_TARGET: &str = "tari::universe::tapplet_manager";

pub struct TappletManager {}

impl TappletManager {
    pub async fn allow_tapplet_csp(
        csp: String,
        app_handle: &AppHandle,
    ) -> Result<String, anyhow::Error> {
        let allowed_csp = allow_csp_dialog(csp, app_handle).await?;
        info!(target: LOG_TARGET, "💭 Tapplet's CSP accepted. CSP: {:?}", &allowed_csp);
        Ok(allowed_csp)
    }
    pub async fn grant_tapplet_permissions(
        permissions: String,
        app_handle: &AppHandle,
    ) -> Result<String, anyhow::Error> {
        let granted_permissions = grant_permissions_dialog(permissions, app_handle).await?;
        info!(target: LOG_TARGET, "💭 Tapplet's permissions granted: {:?}", &granted_permissions);
        Ok(granted_permissions)
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
