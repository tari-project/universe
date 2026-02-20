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

pub mod chain;
#[cfg(test)]
mod chain_test;
pub mod mining;
pub mod scheduler;
pub mod transaction;
pub mod wallet;

use std::sync::Arc;
use std::time::Instant;

use log::info;
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::*;
use rmcp::{ServerHandler, tool, tool_handler, tool_router};
use schemars::JsonSchema;
use serde::Deserialize;
use tokio::sync::watch;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;
use crate::mcp::audit::{AuditEntry, AuditLog, AuditStatus};
use crate::node::node_adapter::BaseNodeStatus;
use crate::wallet::wallet_manager::WalletManager;

#[derive(Clone)]
pub struct TariMcpHandler {
    tool_router: ToolRouter<Self>,
    node_status_rx: Arc<watch::Receiver<BaseNodeStatus>>,
    wallet_manager: WalletManager,
}

#[tool_handler]
impl ServerHandler for TariMcpHandler {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2025_03_26,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation {
                name: "tari-universe".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
                title: Some("Tari Universe MCP Server".to_string()),
                description: Some(
                    "MCP server for controlling mining, querying wallet state, and reading chain data."
                        .to_string(),
                ),
                website_url: None,
                icons: None,
            },
            instructions: Some(
                "Tari Universe MCP server. Available tool categories: mining (start/stop/mode), wallet (address/balance), chain (block height/sync status), and scheduler (scheduled mining events). Use get_mining_status, get_wallet_address, and get_chain_status to get an overview."
                    .to_string(),
            ),
        }
    }
}

#[derive(Deserialize, JsonSchema)]
struct StartStopMiningParams {
    /// Start/stop CPU mining. Defaults to true if neither cpu nor gpu is specified.
    cpu: Option<bool>,
    /// Start/stop GPU mining. Defaults to true if neither cpu nor gpu is specified.
    gpu: Option<bool>,
}

#[derive(Deserialize, JsonSchema)]
struct SetMiningModeParams {
    /// Mining mode name: Eco, Turbo, Ludicrous, or Custom
    mode: String,
}

#[derive(Deserialize, JsonSchema)]
struct GetTransactionHistoryParams {
    /// Maximum number of transactions to return. Defaults to 20.
    limit: Option<u32>,
}

#[derive(Deserialize, JsonSchema)]
struct ScheduleMiningWindowParams {
    /// Unique identifier for the scheduled event
    event_id: String,
    /// Mining mode to use during the window (e.g., Eco, Turbo, Ludicrous)
    mining_mode: String,
    /// Start hour in 12-hour format (1-12)
    start_hour: i64,
    /// Start minute (0-59, defaults to 0)
    start_minute: Option<i64>,
    /// Start time period: "AM" or "PM"
    start_period: String,
    /// End hour in 12-hour format (1-12)
    end_hour: i64,
    /// End minute (0-59, defaults to 0)
    end_minute: Option<i64>,
    /// End time period: "AM" or "PM"
    end_period: String,
}

#[derive(Deserialize, JsonSchema)]
struct CancelScheduledEventParams {
    /// ID of the scheduled event to cancel
    event_id: String,
}

#[derive(Deserialize, JsonSchema)]
struct SendTransactionParams {
    /// Tari address to send to (base58, hex, or emoji format)
    destination: String,
    /// Amount to send in XTM (e.g., "1.5")
    amount: String,
    /// Optional payment ID for the transaction
    payment_id: Option<String>,
}

impl TariMcpHandler {
    pub fn new(
        node_status_rx: Arc<watch::Receiver<BaseNodeStatus>>,
        wallet_manager: WalletManager,
    ) -> Self {
        Self {
            tool_router: Self::tool_router(),
            node_status_rx,
            wallet_manager,
        }
    }

    async fn audit_tool_call(
        &self,
        tool_name: &str,
        tier: &str,
        status: AuditStatus,
        duration_ms: Option<u64>,
    ) {
        let entry = AuditEntry {
            timestamp: std::time::SystemTime::now(),
            tool_name: tool_name.to_string(),
            tier: tier.to_string(),
            status,
            duration_ms,
            client_info: None,
            details: None,
        };
        AuditLog::record(entry).await;
    }

    async fn is_tier_enabled(tier: &str) -> bool {
        let config = ConfigMcp::content().await;
        match tier {
            "read" => *config.read_tier_enabled(),
            "control" => *config.control_tier_enabled(),
            "transaction" => *config.transactions_enabled(),
            _ => false,
        }
    }
}

#[tool_router]
impl TariMcpHandler {
    // ==================== Mining Tools (Control tier) ====================

    /// Get the current mining status including CPU/GPU running state and mining mode.
    #[tool(
        name = "get_mining_status",
        description = "Get current mining status: CPU/GPU running state, mining mode, and enabled settings"
    )]
    async fn get_mining_status(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_mining_status", "control", AuditStatus::Started, None)
            .await;
        let result = mining::get_mining_status().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_mining_status",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Get the currently selected mining mode and its configuration.
    #[tool(
        name = "get_mining_mode",
        description = "Get the currently selected mining mode and its CPU/GPU usage percentages"
    )]
    async fn get_mining_mode(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_mining_mode", "control", AuditStatus::Started, None)
            .await;
        let result = mining::get_mining_mode().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_mining_mode",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// List all available mining modes and their configurations.
    #[tool(
        name = "list_mining_modes",
        description = "List all available mining modes (Eco, Turbo, Ludicrous, Custom) with their CPU/GPU usage settings"
    )]
    async fn list_mining_modes(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("list_mining_modes", "control", AuditStatus::Started, None)
            .await;
        let result = mining::list_mining_modes().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "list_mining_modes",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Start CPU and/or GPU mining.
    #[tool(
        name = "start_mining",
        description = "Start mining. Optionally specify cpu and/or gpu (both default to true)"
    )]
    async fn start_mining(
        &self,
        Parameters(params): Parameters<StartStopMiningParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: start_mining called (cpu={:?}, gpu={:?})", params.cpu, params.gpu);
        self.audit_tool_call("start_mining", "control", AuditStatus::Started, None)
            .await;
        let result = mining::start_mining(params.cpu, params.gpu).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "start_mining",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Stop CPU and/or GPU mining.
    #[tool(
        name = "stop_mining",
        description = "Stop mining. Optionally specify cpu and/or gpu (both default to true)"
    )]
    async fn stop_mining(
        &self,
        Parameters(params): Parameters<StartStopMiningParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: stop_mining called (cpu={:?}, gpu={:?})", params.cpu, params.gpu);
        self.audit_tool_call("stop_mining", "control", AuditStatus::Started, None)
            .await;
        let result = mining::stop_mining(params.cpu, params.gpu).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "stop_mining",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Set the mining mode.
    #[tool(
        name = "set_mining_mode",
        description = "Switch mining mode to Eco, Turbo, Ludicrous, or Custom"
    )]
    async fn set_mining_mode(
        &self,
        Parameters(params): Parameters<SetMiningModeParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: set_mining_mode called (mode={})", params.mode);
        self.audit_tool_call("set_mining_mode", "control", AuditStatus::Started, None)
            .await;
        let result = mining::set_mining_mode(params.mode).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "set_mining_mode",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Get a list of GPU devices and their status.
    #[tool(
        name = "get_gpu_devices",
        description = "List GPU devices with vendor, name, availability, and current parameters (temperature, usage)"
    )]
    async fn get_gpu_devices(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_gpu_devices", "control", AuditStatus::Started, None)
            .await;
        let result = mining::get_gpu_devices().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_gpu_devices",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    // ==================== Wallet Tools (Read tier) ====================

    /// Get the wallet's Tari address in multiple formats.
    #[tool(
        name = "get_wallet_address",
        description = "Get the wallet's Tari address in emoji, base58, and hex formats"
    )]
    async fn get_wallet_address(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("read").await {
            return Err("Read tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_wallet_address", "read", AuditStatus::Started, None)
            .await;
        let result = wallet::get_wallet_address().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_wallet_address",
            "read",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Get the wallet balance.
    #[tool(
        name = "get_wallet_balance",
        description = "Get the wallet balance including available, pending, and timelocked amounts"
    )]
    async fn get_wallet_balance(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("read").await {
            return Err("Read tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_wallet_balance", "read", AuditStatus::Started, None)
            .await;
        let result = wallet::get_wallet_balance(&self.wallet_manager).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_wallet_balance",
            "read",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Get recent transaction history.
    #[tool(
        name = "get_transaction_history",
        description = "Get recent transaction history with configurable limit"
    )]
    async fn get_transaction_history(
        &self,
        Parameters(params): Parameters<GetTransactionHistoryParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("read").await {
            return Err("Read tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call(
            "get_transaction_history",
            "read",
            AuditStatus::Started,
            None,
        )
        .await;
        let result = wallet::get_transaction_history(&self.wallet_manager, params.limit).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_transaction_history",
            "read",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    // ==================== Chain Tools (Read tier) ====================

    /// Get the current chain status.
    #[tool(
        name = "get_chain_status",
        description = "Get chain status: block height, block time, block reward, sync status, peer count"
    )]
    async fn get_chain_status(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("read").await {
            return Err("Read tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_chain_status", "read", AuditStatus::Started, None)
            .await;
        let status = *self.node_status_rx.borrow();
        let result = chain::get_chain_status(&status);
        let audit_status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_chain_status",
            "read",
            audit_status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Get network information.
    #[tool(
        name = "get_network_info",
        description = "Get network info: network name, sync status, connection count"
    )]
    async fn get_network_info(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("read").await {
            return Err("Read tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call("get_network_info", "read", AuditStatus::Started, None)
            .await;
        let status = *self.node_status_rx.borrow();
        let result = chain::get_network_info(&status);
        let audit_status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "get_network_info",
            "read",
            audit_status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    // ==================== Scheduler Tools (Control tier) ====================

    /// List all scheduled mining events.
    #[tool(
        name = "list_scheduled_events",
        description = "List all scheduled mining events with their timing and state"
    )]
    async fn list_scheduled_events(&self) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        self.audit_tool_call(
            "list_scheduled_events",
            "control",
            AuditStatus::Started,
            None,
        )
        .await;
        let result = scheduler::list_scheduled_events().await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "list_scheduled_events",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Schedule recurring daily mining during a time window.
    #[tool(
        name = "schedule_mining_window",
        description = "Schedule recurring daily mining during a time window (e.g., 10 PM to 6 AM in Ludicrous mode)"
    )]
    async fn schedule_mining_window(
        &self,
        Parameters(params): Parameters<ScheduleMiningWindowParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: schedule_mining_window called (id={}, mode={}, start={}:{:02} {}, end={}:{:02} {})",
            params.event_id, params.mining_mode,
            params.start_hour, params.start_minute.unwrap_or(0), params.start_period,
            params.end_hour, params.end_minute.unwrap_or(0), params.end_period);
        self.audit_tool_call(
            "schedule_mining_window",
            "control",
            AuditStatus::Started,
            None,
        )
        .await;
        let result = scheduler::schedule_mining_window(scheduler::MiningWindowParams {
            event_id: params.event_id,
            mining_mode: params.mining_mode,
            start_hour: params.start_hour,
            start_minute: params.start_minute,
            start_period: params.start_period,
            end_hour: params.end_hour,
            end_minute: params.end_minute,
            end_period: params.end_period,
        })
        .await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "schedule_mining_window",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    /// Cancel a scheduled mining event.
    #[tool(
        name = "cancel_scheduled_event",
        description = "Cancel a scheduled mining event by its ID"
    )]
    async fn cancel_scheduled_event(
        &self,
        Parameters(params): Parameters<CancelScheduledEventParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("control").await {
            return Err("Control tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: cancel_scheduled_event called (id={})", params.event_id);
        self.audit_tool_call(
            "cancel_scheduled_event",
            "control",
            AuditStatus::Started,
            None,
        )
        .await;
        let result = scheduler::cancel_scheduled_event(params.event_id).await;
        let status = if result.is_ok() {
            AuditStatus::Success
        } else {
            AuditStatus::Error
        };
        self.audit_tool_call(
            "cancel_scheduled_event",
            "control",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result
    }

    // ==================== Transaction Tools (Transaction tier) ====================

    /// Send a one-sided stealth transaction to a Tari address.
    #[tool(
        name = "send_transaction",
        description = "Send XTM to a Tari address. Requires PIN confirmation via in-app dialog (120s timeout). Amount is in XTM (e.g., '1.5')"
    )]
    async fn send_transaction(
        &self,
        Parameters(params): Parameters<SendTransactionParams>,
    ) -> Result<String, String> {
        if !Self::is_tier_enabled("transaction").await {
            return Err("Transaction tier is disabled".to_string());
        }
        let start = Instant::now();
        info!(target: LOG_TARGET_APP_LOGIC, "MCP: send_transaction called (destination={}, amount={})", params.destination, params.amount);
        self.audit_tool_call(
            "send_transaction",
            "transaction",
            AuditStatus::Started,
            None,
        )
        .await;

        let app_handle = crate::events_emitter::EventsEmitter::get_app_handle_public().await;
        let result = transaction::send_transaction(
            params.destination,
            params.amount,
            params.payment_id,
            &self.wallet_manager,
            &app_handle,
        )
        .await;

        let status = match &result {
            Ok(_) => AuditStatus::Success,
            Err(transaction::TransactionError::Denied(_)) => AuditStatus::Denied,
            Err(transaction::TransactionError::RateLimited(_)) => AuditStatus::RateLimited,
            Err(_) => AuditStatus::Error,
        };
        self.audit_tool_call(
            "send_transaction",
            "transaction",
            status,
            Some(u64::try_from(start.elapsed().as_millis()).unwrap_or(u64::MAX)),
        )
        .await;
        result.map_err(|e| e.to_string())
    }
}
