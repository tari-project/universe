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

use std::time::SystemTime;

use crate::configs::config_mcp::{ConfigMcp, ConfigMcpContent};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::audit::AuditLog;
use crate::mcp::server::McpServerManager;

#[tauri::command]
pub async fn get_mcp_config() -> Result<serde_json::Value, String> {
    let content = ConfigMcp::content().await;
    content.to_redacted_value().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_mcp_token(pin: Option<String>) -> Result<Option<String>, String> {
    if crate::pin::PinManager::pin_locked().await {
        let pin_str = pin.ok_or("PIN is required to reveal the token")?;
        let pin_password = tari_utilities::SafePassword::from(pin_str);
        crate::pin::PinManager::validate_pin(pin_password)
            .await
            .map_err(|e| e.to_string())?;
    }
    let content = ConfigMcp::content().await;
    Ok(content.bearer_token().clone())
}

#[tauri::command]
pub async fn set_mcp_enabled(enabled: bool) -> Result<(), String> {
    {
        let mut config = ConfigMcp::current().write().await;
        let content = config._get_content_mut();
        if enabled && content.bearer_token().is_none() {
            let token = ConfigMcpContent::generate_token();
            let now = SystemTime::now();
            let expiry_days = *content.token_expiry_days();
            let expiry = now + std::time::Duration::from_secs(u64::from(expiry_days) * 86400);
            content.set_bearer_token(Some(token));
            content.set_token_created_at(Some(now));
            content.set_token_expires_at(Some(expiry));
        }
        content.set_enabled(enabled);
        ConfigMcp::_save_config(content.clone()).map_err(|e| e.to_string())?;
    }

    if enabled {
        McpServerManager::start().await.map_err(|e| e.to_string())?;
    } else {
        McpServerManager::stop().await;
    }

    EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;

    Ok(())
}

#[tauri::command]
pub async fn refresh_mcp_token_expiry() -> Result<(), String> {
    if ConfigMcp::content().await.bearer_token().is_some() {
        let now = SystemTime::now();
        let expiry_days = *ConfigMcp::content().await.token_expiry_days();
        let expiry = now + std::time::Duration::from_secs(u64::from(expiry_days) * 86400);
        ConfigMcp::update_field(ConfigMcpContent::set_token_expires_at, Some(expiry))
            .await
            .map_err(|e| e.to_string())?;
    }
    EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;
    Ok(())
}

#[tauri::command]
pub async fn revoke_mcp_token() -> Result<(), String> {
    {
        let mut config = ConfigMcp::current().write().await;
        let content = config._get_content_mut();
        content.set_bearer_token(None::<String>);
        content.set_token_created_at(None::<SystemTime>);
        content.set_token_expires_at(None::<SystemTime>);
        content.set_enabled(false);
        ConfigMcp::_save_config(content.clone()).map_err(|e| e.to_string())?;
    }

    McpServerManager::stop().await;

    EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;

    Ok(())
}

#[tauri::command]
pub async fn set_mcp_port(port: u16) -> Result<(), String> {
    ConfigMcp::update_field(ConfigMcpContent::set_port, port)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_mcp_max_transaction_amount(amount: Option<u64>) -> Result<(), String> {
    ConfigMcp::update_field(ConfigMcpContent::set_max_transaction_amount, amount)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_mcp_tier_enabled(tier: String, enabled: bool) -> Result<(), String> {
    match tier.to_lowercase().as_str() {
        "read" => {
            ConfigMcp::update_field(ConfigMcpContent::set_read_tier_enabled, enabled)
                .await
                .map_err(|e| e.to_string())?;
        }
        "control" => {
            ConfigMcp::update_field(ConfigMcpContent::set_control_tier_enabled, enabled)
                .await
                .map_err(|e| e.to_string())?;
        }
        _ => return Err(format!("Unknown tier: {tier}")),
    }
    Ok(())
}

#[tauri::command]
pub async fn get_mcp_audit_log(count: usize) -> Result<Vec<serde_json::Value>, String> {
    let entries = AuditLog::get_recent(count).await;
    entries
        .into_iter()
        .map(|e| serde_json::to_value(e).map_err(|e| e.to_string()))
        .collect()
}

#[tauri::command]
pub async fn export_mcp_audit_log() -> Result<String, String> {
    AuditLog::export().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_mcp_transactions_enabled(enabled: bool, pin: String) -> Result<(), String> {
    if !crate::pin::PinManager::pin_locked().await {
        return Err(
            "Cannot change MCP transaction settings without a PIN configured. Please set up a PIN first."
                .to_string(),
        );
    }
    let pin_password = tari_utilities::SafePassword::from(pin);
    crate::pin::PinManager::validate_pin(pin_password)
        .await
        .map_err(|e| e.to_string())?;
    ConfigMcp::update_field(ConfigMcpContent::set_transactions_enabled, enabled)
        .await
        .map_err(|e| e.to_string())?;
    EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;
    Ok(())
}

#[tauri::command]
pub async fn mcp_transaction_dialog_response(
    request_id: String,
    approved: bool,
    pin: Option<String>,
) -> Result<(), String> {
    crate::mcp::tools::transaction::respond_to_transaction(request_id, approved, pin).await
}
