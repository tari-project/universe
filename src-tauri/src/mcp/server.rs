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

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mcp::{ConfigMcp, ConfigMcpContent};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::tools::TariMcpHandler;
use crate::node::node_adapter::BaseNodeStatus;
use crate::wallet::wallet_manager::WalletManager;

static INSTANCE: LazyLock<RwLock<McpServerManager>> =
    LazyLock::new(|| RwLock::new(McpServerManager::new()));

const SHUTDOWN_TIMEOUT_SECS: u64 = 5;

pub struct McpServerManager {
    server_handle: Option<JoinHandle<()>>,
    shutdown_tx: Option<tokio::sync::watch::Sender<bool>>,
    bound_port: Option<u16>,
    node_status_rx: Option<Arc<tokio::sync::watch::Receiver<BaseNodeStatus>>>,
    wallet_manager: Option<WalletManager>,
}

impl McpServerManager {
    fn new() -> Self {
        Self {
            server_handle: None,
            shutdown_tx: None,
            bound_port: None,
            node_status_rx: None,
            wallet_manager: None,
        }
    }

    pub fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    pub async fn initialize(
        node_status_rx: Arc<tokio::sync::watch::Receiver<BaseNodeStatus>>,
        wallet_manager: WalletManager,
    ) {
        let mut manager = Self::current().write().await;
        manager.node_status_rx = Some(node_status_rx);
        manager.wallet_manager = Some(wallet_manager);
    }

    pub fn port(&self) -> Option<u16> {
        self.bound_port
    }

    pub fn is_running(&self) -> bool {
        self.server_handle.is_some()
    }

    pub async fn start() -> Result<u16, anyhow::Error> {
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

        // Bind the listener — try configured port first, fall back to OS-assigned
        let addr = std::net::SocketAddr::from(([127, 0, 0, 1], configured_port));
        let listener = match tokio::net::TcpListener::bind(addr).await {
            Ok(l) => {
                info!(target: LOG_TARGET_APP_LOGIC, "MCP server bound to configured port {configured_port}");
                l
            }
            Err(e) => {
                warn!(target: LOG_TARGET_APP_LOGIC, "MCP server failed to bind to port {configured_port}: {e}, falling back to OS-assigned port");
                let fallback_addr = std::net::SocketAddr::from(([127, 0, 0, 1], 0u16));
                tokio::net::TcpListener::bind(fallback_addr).await?
            }
        };

        let bound_port = listener.local_addr()?.port();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP server listening on 127.0.0.1:{bound_port}");

        let wallet_manager = {
            let manager = Self::current().read().await;
            manager.wallet_manager.clone().ok_or_else(|| {
                anyhow::anyhow!("MCP server not initialized — WalletManager not available")
            })?
        };

        // Build the rmcp StreamableHttpService
        let mcp_service: StreamableHttpService<TariMcpHandler, LocalSessionManager> =
            StreamableHttpService::new(
                move || {
                    Ok(TariMcpHandler::new(
                        node_status_rx.clone(),
                        wallet_manager.clone(),
                    ))
                },
                LocalSessionManager::default().into(),
                StreamableHttpServerConfig::default(),
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
            manager.bound_port = Some(bound_port);
        }

        EventsEmitter::emit_mcp_server_status_update(true, Some(bound_port)).await;

        Ok(bound_port)
    }

    pub async fn stop() {
        let (handle, shutdown_tx) = {
            let mut manager = Self::current().write().await;
            let handle = manager.server_handle.take();
            let tx = manager.shutdown_tx.take();
            manager.bound_port = None;
            (handle, tx)
        };

        if let Some(tx) = shutdown_tx {
            let _unused = tx.send(true);
        }

        if let Some(handle) = handle {
            let timeout = tokio::time::timeout(
                std::time::Duration::from_secs(SHUTDOWN_TIMEOUT_SECS),
                handle,
            );
            match timeout.await {
                Ok(Ok(())) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "MCP server shut down cleanly");
                }
                Ok(Err(e)) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "MCP server task panicked: {e:?}");
                }
                Err(_) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "MCP server shutdown timed out after {SHUTDOWN_TIMEOUT_SECS}s");
                }
            }
        }

        EventsEmitter::emit_mcp_server_status_update(false, None).await;

        crate::mcp::tools::transaction::clear_inflight().await;
    }

    pub async fn restart() -> Result<u16, anyhow::Error> {
        Self::stop().await;
        Self::start().await
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
                let _ = ConfigMcp::update_field(
                    ConfigMcpContent::set_token_expires_at,
                    Some(
                        SystemTime::now()
                            + std::time::Duration::from_secs(
                                u64::from(*config.token_expiry_days()) * 86400,
                            ),
                    ),
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
