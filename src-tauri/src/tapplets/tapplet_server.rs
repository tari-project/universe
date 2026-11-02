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

use crate::{
    LOG_TARGET_APP_LOGIC,
    tapplets::error::{
        Error::{self, TappletServerError},
        TappletServerError::*,
    },
};

use axum::Router;
use log::{error, info};
use std::{collections::HashMap, net::SocketAddr, path::PathBuf, sync::LazyLock};
use tokio::{select, sync::Mutex};
use tokio_util::sync::CancellationToken;
use tower_http::services::ServeDir;

static ACTIVE_TAPPLET_SERVERS: LazyLock<Mutex<HashMap<PathBuf, CancellationToken>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub async fn start_tapplet(tapplet_path: PathBuf) -> Result<(String, CancellationToken), Error> {
    info!(target: LOG_TARGET_APP_LOGIC, "Start tapplet path {:?}", &tapplet_path);
    let key = tapplet_path
        .canonicalize()
        .unwrap_or_else(|_| tapplet_path.clone());
    // Starts are serialized across tapplets; use per-path locks if the number grows.
    let mut active_servers = ACTIVE_TAPPLET_SERVERS.lock().await;
    active_servers.retain(|_, token| !token.is_cancelled());
    if let Some(prev_token) = active_servers.remove(&key) {
        prev_token.cancel();
    }
    let (address, cancel_token) = serve(using_serve_dir(tapplet_path), 0).await?;
    active_servers.insert(key, cancel_token.clone());
    Ok((address, cancel_token))
}

pub fn using_serve_dir(tapplet_path: PathBuf) -> Router {
    let serve_dir = ServeDir::new(tapplet_path);
    Router::new().nest_service("/", serve_dir)
}

pub async fn serve(app: Router, port: u16) -> Result<(String, CancellationToken), Error> {
    info!(target: LOG_TARGET_APP_LOGIC, "Launch tapplet on port {:?}", &port);
    let cancel_token = CancellationToken::new();
    let cancel_token_clone = cancel_token.clone();

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .inspect_err(
            |e| error!(target: LOG_TARGET_APP_LOGIC, "Failed to bind port server error: {e:?}"),
        )
        .map_err(|_| {
            TappletServerError(BindPortError {
                port: addr.to_string(),
            })
        })?;
    let address = listener
        .local_addr()
        .inspect_err(
            |e| error!(target: LOG_TARGET_APP_LOGIC, "Failed to obtain local address error: {e:?}"),
        )
        .map_err(|_| TappletServerError(FailedToObtainLocalAddress))?
        .to_string();

    tauri::async_runtime::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown_signal(cancel_token_clone))
            .await
            .inspect_err(
                |e| error!(target: LOG_TARGET_APP_LOGIC, "Failed to start server error: {e:?}"),
            )
            .map_err(|_| TappletServerError(FailedToStart))
    });
    info!(target: LOG_TARGET_APP_LOGIC, "🚀 The tapplet was launched at the address: {:?}", &address);

    Ok((address, cancel_token))
}

async fn shutdown_signal(cancel_token: CancellationToken) {
    select! {
        _ = cancel_token.cancelled() => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn concurrent_starts_leave_only_one_server_active_for_a_path() {
        let directory = tempfile::tempdir().expect("temporary tapplet directory");
        let path = directory.path().to_path_buf();
        let (first, second) =
            tokio::join!(start_tapplet(path.clone()), start_tapplet(path.clone()));
        let (_, first_token) = first.expect("first server starts");
        let (_, second_token) = second.expect("second server starts");

        assert!(first_token.is_cancelled() ^ second_token.is_cancelled());
        first_token.cancel();
        second_token.cancel();
        ACTIVE_TAPPLET_SERVERS.lock().await.remove(&path);
    }
}
