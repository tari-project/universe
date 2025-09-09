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
    tapplets::{
        error::{
            Error::{self, JsonParsingError, RequestError, TappletServerError},
            RequestError::{FetchConfigError, ManifestResponseError},
            TappletServerError::*,
        },
        interface::{TappletConfig, TappletManifest},
    },
};
use axum::{
    body::Body,
    http::{HeaderValue, Request, Response},
    middleware::{self, Next},
    Router,
};
use log::{error, info, warn};
use std::{fs, net::SocketAddr, path::PathBuf};
use tauri::Url;
use tokio::select;
use tokio_util::sync::CancellationToken;
use tower_http::services::ServeDir;
const LOG_TARGET: &str = "tari::tapplet";

/// Middleware that adds a CSP header dynamically
async fn add_csp_header(req: Request<Body>, next: Next, csp_header: HeaderValue) -> Response<Body> {
    let mut response = next.run(req).await;
    response
        .headers_mut()
        .insert("Content-Security-Policy", csp_header);
    response
}

/// Middleware that fixes MIME types for common file extensions
async fn fix_mime_types(req: Request<Body>, next: Next) -> Response<Body> {
    // Get the request path to determine file extension before moving the request
    let path = req.uri().path().to_string();

    let mut response = next.run(req).await;

    // Set correct Content-Type based on file extension
    if let Some(extension) = path.split('.').last() {
        let mime_type = match extension {
            "js" => Some("application/javascript"),
            "mjs" => Some("application/javascript"),
            "css" => Some("text/css"),
            "html" => Some("text/html"),
            "json" => Some("application/json"),
            "png" => Some("image/png"),
            "jpg" | "jpeg" => Some("image/jpeg"),
            "gif" => Some("image/gif"),
            "svg" => Some("image/svg+xml"),
            "woff" => Some("font/woff"),
            "woff2" => Some("font/woff2"),
            "ttf" => Some("font/ttf"),
            "eot" => Some("application/vnd.ms-fontobject"),
            _ => None,
        };

        if let Some(mime) = mime_type {
            if let Ok(header_value) = HeaderValue::from_str(mime) {
                response.headers_mut().insert("Content-Type", header_value);
            }
        }
    }

    response
}

pub fn using_serve_dir(tapplet_path: PathBuf, csp_header: HeaderValue) -> Router {
    let serve_dir = ServeDir::new(tapplet_path);

    Router::new()
        .nest_service("/", serve_dir)
        .layer(middleware::from_fn(fix_mime_types))
        .layer(middleware::from_fn(move |req, next| {
            let csp = csp_header.clone();
            async move { add_csp_header(req, next, csp).await }
        }))
}

pub async fn start_tapplet_server(
    tapplet_path: PathBuf,
    csp: &String,
) -> Result<(String, CancellationToken), Error> {
    let port = PortAllocator::new().assign_port_with_fallback();
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let csp_header = HeaderValue::from_str(csp.trim_matches('"')).unwrap_or_else(|e| {
        warn!(target: LOG_TARGET, "Failed to create HeaderValue: {}", e);
        HeaderValue::from_static("default-src 'self'")
    });

    info!(target: LOG_TARGET, "🚨📢🔔⚠️ SERVER WITH CSP {:?}", &csp_header);
    // Build router with dynamically created CSP header middleware
    let app = using_serve_dir(tapplet_path, csp_header);

    serve(app, addr).await
}

pub async fn serve(app: Router, addr: SocketAddr) -> Result<(String, CancellationToken), Error> {
    let cancel_token = CancellationToken::new();
    let cancel_token_clone = cancel_token.clone();

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

pub fn is_http_or_localhost(s: &str) -> bool {
    if let Ok(url) = Url::parse(s) {
        let scheme = url.scheme();
        if scheme == "http" || scheme == "https" {
            return true;
        }
    }
    // Also check if string contains "localhost", "http", or "https" (case insensitive)
    let s_lower = s.to_lowercase();
    s_lower.contains("localhost") || s_lower.contains("http") || s_lower.contains("https")
}

pub fn _get_tapplet_manifest(tapp_path: PathBuf) -> Result<TappletManifest, Error> {
    // for a dev tapplet the tapplet.manifest.json file is in root dir
    let tapp_manifest = tapp_path.join("tapplet.manifest.json");
    info!(target: LOG_TARGET, "💥 get_config {:?}", &tapp_manifest);

    if !tapp_manifest.exists() {
        warn!(target: LOG_TARGET, "❌ Failed to get Tapplet permissions. Config file not found.");
        return Err(Error::TappletConfigNotFound);
    }

    let config = fs::read_to_string(tapp_manifest.clone()).unwrap_or_default();
    info!(target: LOG_TARGET, "💥 Dev tapplet config: {:?}", &config);
    let manifest: TappletManifest =
        serde_json::from_str(&config).map_err(|e| JsonParsingError(e))?;
    info!(target: LOG_TARGET, "💥 Dev tapplet full config: {:?}", &manifest);
    Ok(manifest)
}

pub async fn get_tapp_config(source: &str) -> Result<TappletConfig, Error> {
    if is_http_or_localhost(source) {
        // compose full URL for config JSON
        let config_source = if source.ends_with("tapplet.config.json") {
            source.to_string()
        } else {
            format!("{}/tapplet.config.json", source.trim_end_matches('/'))
        };
        info!(target: LOG_TARGET, "Fetching tapplet config from {:?}", &config_source);

        let response = reqwest::get(&config_source).await.map_err(|_| {
            RequestError(FetchConfigError {
                endpoint: source.to_string(),
            })
        })?;

        let tapplet_config = response.json::<TappletConfig>().await.map_err(|e| {
            RequestError(ManifestResponseError {
                endpoint: source.to_string(),
                e: e.to_string(),
            })
        })?;
        info!(target: LOG_TARGET, "Fetched tapplet config: {:?}", &tapplet_config);
        Ok(tapplet_config)
    } else {
        // source as a local path
        let tapp_path = PathBuf::from(source);
        let tapp_config = tapp_path.join("tapplet.config.json");
        info!(target: LOG_TARGET, "Reading tapplet config from {:?}", &tapp_config);

        if !tapp_config.exists() {
            warn!(target: LOG_TARGET, "❌ Failed to get Tapplet permissions. Config file not found.");
            return Err(Error::TappletConfigNotFound);
        }

        let config = fs::read_to_string(&tapp_config).unwrap_or_default();
        info!(target: LOG_TARGET, "💥 Dev tapplet config: {:?}", &config);
        let tapplet_config: TappletConfig =
            serde_json::from_str(&config).map_err(JsonParsingError)?;
        info!(target: LOG_TARGET, "💥 Dev tapplet full config: {:?}", &tapplet_config);
        Ok(tapplet_config)
    }
}
