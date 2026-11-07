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

use crate::configs::config_mcp::{ConfigMcp, ConfigMcpContent, compute_token_expiry};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::audit::AuditLog;
use crate::mcp::server::McpServerManager;

#[derive(Debug, serde::Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum McpSettingsError {
    PortInUse { port: u16 },
    StartFailed { port: u16 },
    Configuration { message: String },
}

impl McpSettingsError {
    fn start(error: anyhow::Error, port: u16) -> Self {
        if error
            .downcast_ref::<std::io::Error>()
            .is_some_and(|e| e.kind() == std::io::ErrorKind::AddrInUse)
        {
            Self::PortInUse { port }
        } else {
            log::error!(target: crate::LOG_TARGET_APP_LOGIC, "MCP server failed to start on port {port}: {error:#}");
            Self::StartFailed { port }
        }
    }
}

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
pub async fn set_mcp_enabled(enabled: bool) -> Result<(), McpSettingsError> {
    {
        let mut config = ConfigMcp::current().write().await;
        let mut updated = config._get_content().clone();
        apply_mcp_enable_state(&mut updated, enabled);
        ConfigMcp::_save_config(updated.clone()).map_err(|e| McpSettingsError::Configuration {
            message: e.to_string(),
        })?;
        *config._get_content_mut() = updated;
    }

    // Configuration is saved even if binding fails. Keep the UI in sync so the
    // configured port remains editable without toggling the server off and on.
    let content = ConfigMcp::content().await;
    EventsEmitter::emit_mcp_config_loaded(&content).await;
    if enabled {
        McpServerManager::start()
            .await
            .map_err(|e| McpSettingsError::start(e, *content.port()))?;
    } else {
        McpServerManager::stop().await;
    }

    Ok(())
}

#[tauri::command]
pub async fn refresh_mcp_token_expiry() -> Result<(), String> {
    if ConfigMcp::content().await.bearer_token().is_some() {
        let now = SystemTime::now();
        let expiry_days = *ConfigMcp::content().await.token_expiry_days();
        let expiry = compute_token_expiry(now, expiry_days);
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
        let mut updated = config._get_content().clone();
        apply_mcp_token_revocation(&mut updated);
        ConfigMcp::_save_config(updated.clone()).map_err(|e| e.to_string())?;
        *config._get_content_mut() = updated;
    }

    McpServerManager::stop().await;

    EventsEmitter::emit_mcp_config_loaded(&ConfigMcp::content().await).await;

    Ok(())
}

#[tauri::command]
pub async fn set_mcp_port(port: u16) -> Result<(), McpSettingsError> {
    if port < 1024 {
        return Err(McpSettingsError::Configuration {
            message: "Port must be between 1024 and 65535".to_string(),
        });
    }
    ConfigMcp::update_field(ConfigMcpContent::set_port, port)
        .await
        .map_err(|e| McpSettingsError::Configuration {
            message: e.to_string(),
        })?;
    // Restart if currently running so the new port takes effect
    let content = ConfigMcp::content().await;
    EventsEmitter::emit_mcp_config_loaded(&content).await;
    if *content.enabled() {
        McpServerManager::restart()
            .await
            .map_err(|e| McpSettingsError::start(e, port))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_mcp_max_transaction_amount(
    amount: Option<u64>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let _validated_pin = crate::pin::PinManager::get_validated_pin_if_defined(&app_handle, None)
        .await
        .map_err(|e| e.to_string())?;
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
) -> Result<(), String> {
    crate::wallet::send_gate::respond_to_transaction(request_id, approved).await
}

fn apply_mcp_enable_state(content: &mut ConfigMcpContent, enabled: bool) {
    if enabled {
        if !*content.enabled() {
            content.set_transactions_enabled(false);
        }
        content.ensure_token();
    }
    content.set_enabled(enabled);
}

fn apply_mcp_token_revocation(content: &mut ConfigMcpContent) {
    content.revoke_token();
    content.set_enabled(false);
    content.set_transactions_enabled(false);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bind_error_keeps_its_kind_through_anyhow_context() {
        let error = anyhow::Error::new(std::io::Error::from(std::io::ErrorKind::AddrInUse))
            .context("MCP server failed to bind");
        let error = super::McpSettingsError::start(error, 4444);
        assert_eq!(
            serde_json::to_value(error).unwrap(),
            serde_json::json!({"kind": "port_in_use", "port": 4444})
        );
    }

    #[test]
    fn other_startup_errors_are_not_reported_as_port_conflicts() {
        let error = anyhow::Error::new(std::io::Error::from(std::io::ErrorKind::PermissionDenied));
        let error = super::McpSettingsError::start(error, 4444);
        assert_eq!(
            serde_json::to_value(error).unwrap(),
            serde_json::json!({"kind": "start_failed", "port": 4444})
        );
    }

    #[test]
    fn revoking_token_disables_transactions_and_reenabling_without_pin_keeps_them_off() {
        let mut content = ConfigMcpContent::default();
        content.set_enabled(true);
        content.set_bearer_token(Some("tu_old_token".to_string()));
        content.set_transactions_enabled(true);

        apply_mcp_token_revocation(&mut content);
        assert!(!*content.enabled());
        assert!(content.bearer_token().is_none());
        assert!(!*content.transactions_enabled());

        // A new bearer token must not inherit the old transaction permission.
        content.set_transactions_enabled(true);
        apply_mcp_enable_state(&mut content, true);
        assert!(*content.enabled());
        assert!(content.bearer_token().is_some());
        assert!(!*content.transactions_enabled());
    }

    #[test]
    fn enabling_an_already_enabled_server_keeps_its_pinned_transaction_permission() {
        let mut content = ConfigMcpContent::default();
        content.set_enabled(true);
        content.set_transactions_enabled(true);
        apply_mcp_enable_state(&mut content, true);
        assert!(*content.transactions_enabled());
    }
}
