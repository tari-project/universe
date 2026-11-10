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

use std::sync::{Arc, LazyLock};
use std::time::SystemTime;

use axum08 as axum;
use log::{error, info, warn};
use rmcp::transport::StreamableHttpServerConfig;
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::streamable_http_server::tower::StreamableHttpService;
use sha2::{Digest, Sha256};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mcp::{ConfigMcp, ConfigMcpContent, compute_token_expiry};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::tools::TariMcpHandler;
use crate::node::node_adapter::BaseNodeStatus;

static INSTANCE: LazyLock<RwLock<McpServerManager>> =
    LazyLock::new(|| RwLock::new(McpServerManager::new()));
static LIFECYCLE: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

const SHUTDOWN_TIMEOUT_SECS: u64 = 5;

/// The frontend translates `MCP_PORT_IN_USE:<port>`. The OS error text is not
/// part of that contract — it is logged here, because it differs per platform.
const PORT_IN_USE_MARKER: &str = "MCP_PORT_IN_USE";

pub struct McpServerManager {
    server_handle: Option<JoinHandle<()>>,
    shutdown_tx: Option<tokio::sync::watch::Sender<bool>>,
    request_cancel: Option<CancellationToken>,
    bound_port: Option<u16>,
    node_status_rx: Option<Arc<tokio::sync::watch::Receiver<BaseNodeStatus>>>,
}

impl McpServerManager {
    fn new() -> Self {
        Self {
            server_handle: None,
            shutdown_tx: None,
            request_cancel: None,
            bound_port: None,
            node_status_rx: None,
        }
    }

    pub fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    pub async fn initialize(node_status_rx: Arc<tokio::sync::watch::Receiver<BaseNodeStatus>>) {
        let mut manager = Self::current().write().await;
        manager.node_status_rx = Some(node_status_rx);
    }

    pub fn port(&self) -> Option<u16> {
        self.bound_port
    }

    pub fn is_running(&self) -> bool {
        self.server_handle.is_some()
    }

    pub async fn start() -> Result<u16, anyhow::Error> {
        let _lifecycle = LIFECYCLE.lock().await;
        Self::start_locked().await
    }

    async fn start_locked() -> Result<u16, anyhow::Error> {
        // Check if already running
        {
            let manager = Self::current().read().await;
            if manager.is_running()
                && let Some(port) = manager.port()
            {
                info!(target: LOG_TARGET_APP_LOGIC, "MCP server already running on port {port}");
                return Ok(port);
            }
        }

        let config = ConfigMcp::content().await;

        if !*config.enabled() {
            anyhow::bail!("MCP server is not enabled");
        }

        let token = config
            .bearer_token()
            .clone()
            .ok_or_else(|| anyhow::anyhow!("MCP server has no bearer token configured"))?;

        let configured_port = *config.port();

        // Get the node status receiver for chain tools
        let node_status_rx = {
            let manager = Self::current().read().await;
            manager.node_status_rx.clone().ok_or_else(|| {
                anyhow::anyhow!(
                    "MCP server not initialized — call McpServerManager::initialize() first"
                )
            })?
        };

        let listener = bind_configured_port(configured_port).await?;
        info!(target: LOG_TARGET_APP_LOGIC, "MCP server bound to configured port {configured_port}");

        let bound_port = listener.local_addr()?.port();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP server listening on 127.0.0.1:{bound_port}");

        // Build the rmcp StreamableHttpService
        let request_cancel = CancellationToken::new();
        let handler_cancel = request_cancel.clone();
        let mcp_service: StreamableHttpService<TariMcpHandler, LocalSessionManager> =
            StreamableHttpService::new(
                move || {
                    Ok(TariMcpHandler::new(
                        node_status_rx.clone(),
                        handler_cancel.clone(),
                    ))
                },
                LocalSessionManager::default().into(),
                StreamableHttpServerConfig::default()
                    .with_cancellation_token(request_cancel.clone()),
            );

        // Build axum 0.8 router with bearer auth middleware
        let protected_router =
            axum::Router::new()
                .nest_service("/mcp", mcp_service)
                .layer(axum::middleware::from_fn(move |req, next| {
                    let token = token.clone();
                    auth_middleware(token, req, next)
                }));

        // Shutdown channel
        let (shutdown_tx, mut shutdown_rx) = tokio::sync::watch::channel(false);

        let handle = tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, protected_router)
                .with_graceful_shutdown(async move {
                    let _unused = shutdown_rx.wait_for(|v| *v).await;
                })
                .await
            {
                error!(target: LOG_TARGET_APP_LOGIC, "MCP server exited with error: {e:?}");
            }
            info!(target: LOG_TARGET_APP_LOGIC, "MCP server stopped");
        });

        // Store state
        {
            let mut manager = Self::current().write().await;
            manager.server_handle = Some(handle);
            manager.shutdown_tx = Some(shutdown_tx);
            manager.request_cancel = Some(request_cancel);
            manager.bound_port = Some(bound_port);
        }

        EventsEmitter::emit_mcp_server_status_update(true, Some(bound_port)).await;

        Ok(bound_port)
    }

    pub async fn stop() {
        let _lifecycle = LIFECYCLE.lock().await;
        Self::stop_locked().await;
    }

    async fn stop_locked() {
        let (handle, shutdown_tx, request_cancel) = {
            let mut manager = Self::current().write().await;
            let handle = manager.server_handle.take();
            let tx = manager.shutdown_tx.take();
            let request_cancel = manager.request_cancel.take();
            manager.bound_port = None;
            (handle, tx, request_cancel)
        };

        if let Some(cancel) = request_cancel {
            cancel.cancel();
        }
        crate::wallet::send_gate::clear_inflight_from(crate::wallet::send_gate::SendOrigin::Mcp)
            .await;

        if let Some(tx) = shutdown_tx {
            let _unused = tx.send(true);
        }

        if let Some(mut handle) = handle {
            let timeout = tokio::time::timeout(
                std::time::Duration::from_secs(SHUTDOWN_TIMEOUT_SECS),
                &mut handle,
            );
            match timeout.await {
                Ok(Ok(())) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "MCP server shut down cleanly");
                }
                Ok(Err(e)) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "MCP server task panicked: {e:?}");
                }
                Err(_) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "MCP server shutdown timed out after {SHUTDOWN_TIMEOUT_SECS}s; aborting task");
                    handle.abort();
                    let _unused = handle.await;
                }
            }
        }

        EventsEmitter::emit_mcp_server_status_update(false, None).await;
    }

    pub async fn restart() -> Result<u16, anyhow::Error> {
        let _lifecycle = LIFECYCLE.lock().await;
        Self::stop_locked().await;
        Self::start_locked().await
    }
}

/// Bind exactly `configured_port`. A failure is logged with the port and the OS
/// error and returned to the caller — the listener is never moved to a free port,
/// because a process already bound there could read the bearer token.
async fn bind_configured_port(
    configured_port: u16,
) -> Result<tokio::net::TcpListener, anyhow::Error> {
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], configured_port));
    tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|err| bind_error(configured_port, err))
}

fn bind_error(configured_port: u16, err: std::io::Error) -> anyhow::Error {
    error!(
        target: LOG_TARGET_APP_LOGIC,
        "MCP server failed to bind to configured port {configured_port}: {err}. \
         Refusing to fall back to a random port for security reasons — \
         another process on the configured port could intercept bearer tokens."
    );
    let in_use = err.kind() == std::io::ErrorKind::AddrInUse;
    let report = anyhow::Error::from(err);
    if in_use {
        report.context(format!("{PORT_IN_USE_MARKER}:{configured_port}"))
    } else {
        report.context(format!(
            "MCP server failed to bind to configured port {configured_port}. \
             Refusing to fall back to a random port for security reasons — \
             another process on the configured port could intercept bearer tokens."
        ))
    }
}

async fn auth_middleware(
    expected_token: String,
    req: axum::http::Request<axum::body::Body>,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, axum::http::StatusCode> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v: &axum::http::HeaderValue| v.to_str().ok());

    match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            let provided = &header[7..];
            // Constant-time comparison via hashing to avoid timing side-channels
            let provided_hash = Sha256::digest(provided.as_bytes());
            let expected_hash = Sha256::digest(expected_token.as_bytes());
            if provided_hash == expected_hash {
                let config = ConfigMcp::content().await;
                if config.is_token_expired() {
                    return Err(axum::http::StatusCode::UNAUTHORIZED);
                }
                // Sliding-window refresh: bump expiry on each successful request
                // so the token only expires after `token_expiry_days` of inactivity.
                let _unused = ConfigMcp::update_field(
                    ConfigMcpContent::set_token_expires_at,
                    Some(compute_token_expiry(
                        SystemTime::now(),
                        *config.token_expiry_days(),
                    )),
                )
                .await;
                Ok(next.run(req).await)
            } else {
                Err(axum::http::StatusCode::UNAUTHORIZED)
            }
        }
        _ => Err(axum::http::StatusCode::UNAUTHORIZED),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[serial_test::serial]
    async fn lifecycle_calls_wait_for_a_stopping_server() {
        let cancel = CancellationToken::new();
        let (finish_tx, finish_rx) = tokio::sync::oneshot::channel::<()>();
        let handle = tokio::spawn(async move {
            let _unused = finish_rx.await;
        });
        {
            let mut manager = McpServerManager::current().write().await;
            manager.server_handle = Some(handle);
            manager.request_cancel = Some(cancel.clone());
            manager.bound_port = Some(19222);
        }

        let mut stop = Box::pin(McpServerManager::stop());
        assert!(futures::poll!(stop.as_mut()).is_pending());
        assert!(cancel.is_cancelled());
        assert!(McpServerManager::current().read().await.port().is_none());

        // The old listener is still shutting down even though its state was taken.
        let mut start = Box::pin(McpServerManager::start());
        let mut restart = Box::pin(McpServerManager::restart());
        let mut second_stop = Box::pin(McpServerManager::stop());
        assert!(futures::poll!(start.as_mut()).is_pending());
        assert!(futures::poll!(restart.as_mut()).is_pending());
        assert!(futures::poll!(second_stop.as_mut()).is_pending());

        drop(start);
        drop(restart);
        drop(second_stop);
        drop(stop);
        let _unused = finish_tx.send(());
        assert!(LIFECYCLE.try_lock().is_ok());
    }

    #[tokio::test]
    async fn bind_failure_names_the_occupied_port_and_does_not_fall_back() {
        let held = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0))
            .await
            .expect("hold port");
        let port = held.local_addr().expect("held addr").port();

        let err = bind_configured_port(port)
            .await
            .expect_err("occupied port must fail");
        assert_eq!(err.to_string(), format!("{PORT_IN_USE_MARKER}:{port}"));
        // `bind_error` logs this io::Error with the port. Keep it on the chain
        // so the OS error is not discarded for a random-port fallback.
        let kind = err.chain().find_map(|cause| {
            cause
                .downcast_ref::<std::io::Error>()
                .map(std::io::Error::kind)
        });
        assert_eq!(kind, Some(std::io::ErrorKind::AddrInUse));
        assert_eq!(held.local_addr().expect("held addr").port(), port);
    }

    #[tokio::test]
    async fn bind_listens_on_the_configured_port() {
        let probe = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0))
            .await
            .expect("probe");
        let port = probe.local_addr().expect("probe addr").port();
        drop(probe);

        let listener = bind_configured_port(port)
            .await
            .expect("bind configured port");
        assert_eq!(listener.local_addr().expect("bound addr").port(), port);
    }
}
