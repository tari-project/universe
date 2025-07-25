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
    port_allocator::PortAllocator,
    tapplets::error::{
        Error::{self, TappletServerError},
        TappletServerError::*,
    },
};

use axum::{
    body::Body,
    http::{HeaderValue, Request, Response},
    middleware::{self, Next},
    response::IntoResponse,
    Extension, Json, Router,
};
use log::{error, info};
use reqwest::StatusCode;
use serde::Deserialize;
use std::{net::SocketAddr, path::PathBuf, sync::Arc};
use tokio::{select, sync::RwLock};
use tokio_util::sync::CancellationToken;
use tower_http::services::ServeDir;
const LOG_TARGET: &str = "tari::tapplet";


/// Middleware that adds a CSP header dynamically from the captured `Arc<HeaderValue>`
async fn add_csp_header(
    req: Request<Body>,
    next: Next,
    csp_header: Arc<RwLock<HeaderValue>>,
) -> Response<Body> {
    let mut response = next.run(req).await;
    let current_csp = csp_header.read().await;
    response
        .headers_mut()
        .insert("Content-Security-Policy", current_csp.clone());
    response
}

pub fn using_serve_dir(tapplet_path: PathBuf, csp_header: Arc<RwLock<HeaderValue>>) -> Router {
    let serve_dir = ServeDir::new(tapplet_path);

    Router::new()
        .nest_service("/", serve_dir)
        .layer(middleware::from_fn(move |req, next| {
            let csp_header = csp_header.clone();
            async move { add_csp_header(req, next, csp_header).await }
        }))
}

pub async fn start_tapplet(
    tapplet_path: PathBuf,
    csp_header: Arc<RwLock<HeaderValue>>,
) -> Result<(String, CancellationToken), Error> {
    info!(target: LOG_TARGET, "Start tapplet path {:?}", &tapplet_path);

    // Dynamically get port from your allocator
    let port = PortAllocator::new().assign_port_with_fallback();
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    info!(target: LOG_TARGET, "Assigned port: {:?}", port);

    // Build router with dynamically created CSP header middleware
    let app = using_serve_dir(tapplet_path, csp_header);

    // Start your server with the known addr
    serve(app, addr).await
}

pub async fn serve(app: Router, addr: SocketAddr) -> Result<(String, CancellationToken), Error> {
    // info!(target: LOG_TARGET, "Launch tapplet on port {:?}", &port);
    let cancel_token = CancellationToken::new();
    let cancel_token_clone = cancel_token.clone();

    // let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "Failed to bind port server error: {e:?}"))
        .map_err(|_| {
            TappletServerError(BindPortError {
                port: addr.to_string(),
            })
        })?;
    let address = listener
        .local_addr()
        .inspect_err(|e| error!(target: LOG_TARGET, "Failed to obtain local address error: {e:?}"))
        .map_err(|_| TappletServerError(FailedToObtainLocalAddress))?
        .to_string();

    tauri::async_runtime::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown_signal(cancel_token_clone))
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Failed to start server error: {e:?}"))
            .map_err(|_| TappletServerError(FailedToStart))
    });
    info!(target: LOG_TARGET, "🚀 The tapplet was launched at the address: {:?}", &address);

    Ok((address, cancel_token))
}

async fn shutdown_signal(cancel_token: CancellationToken) {
    select! {
        _ = cancel_token.cancelled() => {}
    }
}
