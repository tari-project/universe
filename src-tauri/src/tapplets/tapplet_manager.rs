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
        let csp = allow_csp_dialog(csp, app_handle).await?;
        Ok(csp)
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
    app_handle.once("tapplet-csp-dialog-response", move |event| {
        let csp = event.payload().trim();

        if csp.len() > 0 {
            let _unused = tx.send(Some(csp.to_string()));
        } else {
            let _unused = tx.send(None);
        }
    });

    // Await the response
    let csp = rx.await.unwrap_or_default();
    if let Some(csp) = csp {
        Ok(csp.to_string())
    } else {
        log::info!("Granting tapplet CSP failed");
        Err(anyhow::anyhow!("Granting tapplet CSP failed"))
    }
}

async fn allow_csp_dialog(csp: String, app_handle: &AppHandle) -> Result<String, anyhow::Error> {
    csp_dialog_with_emitter(app_handle, || {
        EventsEmitter::emit_allow_tapplet_csp(csp.clone())
    })
    .await
}
