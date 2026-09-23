// MIT License
// Copyright (c) 2025 DraviaVemal
// See LICENSE file in the root directory.

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum OriginType {
    Localhost,
    Direct,
    Any,
}

impl From<OriginType> for &str {
    fn from(value: OriginType) -> Self {
        match value {
            OriginType::Localhost => "127.0.0.1",
            OriginType::Direct => "::",
            _ => "0.0.0.0",
        }
    }
}

#[derive(Serialize)]
pub struct RemoteUiEvent<P> {
    pub event_name: String,
    pub window_label: Option<String>,
    pub payload: P,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmitRequest {
    pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmitResponse {
    pub value: Option<String>,
}

/// Describe this struct.
/// # Fields
/// - `allowed_origin` (`Vec<String>`) - Allowed orgin
/// - `port` (`Option<u16>`) - Set None for random port and value for specific port to use
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteUiConfig {
    pub(crate) application_ui: bool,
    pub(crate) allowed_origin: OriginType,
    pub(crate) port: Option<u16>,
    pub(crate) bundle_path: Option<String>,
    pub(crate) minimize_app: bool,
    pub(crate) enable_info_url: bool,
    pub(crate) custom_blocking_ui: Option<String>,
    pub(crate) custom_disconnect_ui: Option<String>,
}

impl Default for RemoteUiConfig {
    fn default() -> Self {
        RemoteUiConfig {
            application_ui: false,
            allowed_origin: OriginType::Localhost,
            port: None,
            bundle_path: None,
            enable_info_url: true,
            minimize_app: false,
            custom_disconnect_ui: None,
            custom_blocking_ui: None,
        }
    }
}

impl RemoteUiConfig {
    /// This enable tauri actual UI and navigate to same path without blocking the actual UI
    pub fn enable_application_ui(mut self) -> RemoteUiConfig {
        self.application_ui = true;
        self
    }
    /// On server start the actual tauri app will minimize from screen
    pub fn minimize_app(mut self) -> RemoteUiConfig {
        self.minimize_app = true;
        self
    }

    /// Default info url path will be responded with 404
    pub fn disable_info_url(mut self) -> RemoteUiConfig {
        self.enable_info_url = false;
        self
    }

    /// Allowed origin IP the web server accept to respond
    pub fn set_allowed_origin(mut self, allowed_origin: OriginType) -> RemoteUiConfig {
        self.allowed_origin = allowed_origin;
        self
    }

    /// Set the target port to use. If not set random port will be assigned see UI or console for info
    pub fn set_port(mut self, port: Option<u16>) -> RemoteUiConfig {
        self.port = port;
        self
    }

    /// Html bundle path so the remote ui server will server the content
    pub fn set_bundle_path(mut self, bundle_path: Option<String>) -> RemoteUiConfig {
        self.bundle_path = bundle_path;
        self
    }

    /// Inject standardized HTML, CSS, and JavaScript to allow customization of the UI blocking message during a remote session
    /// Pass %URL% where URL will be updated and %URL_INFO% for info path
    pub fn set_custom_blocking_ui(mut self, bundle_path: Option<String>) -> RemoteUiConfig {
        self.bundle_path = bundle_path;
        self
    }

    /// Inject standardized HTML, CSS, and JavaScript to allow customization of the UI on disconnect/redirect screen
    pub fn set_custom_disconnect_ui(
        mut self,
        custom_disconnect_ui: Option<String>,
    ) -> RemoteUiConfig {
        self.custom_disconnect_ui = custom_disconnect_ui;
        self
    }

    pub fn get_allowed_origin(&self) -> OriginType {
        self.allowed_origin
    }

    pub fn get_port(&self) -> Option<u16> {
        self.port
    }

    pub fn get_bundle_path(&self) -> Option<String> {
        self.bundle_path.clone()
    }
}

// Structure representing the payload of an RPC invoke request
#[derive(Debug, Deserialize)]
pub struct WsPayload {
    pub id: usize,
    pub cmd: String,
    pub args: Option<Value>,
    pub option: Option<Value>,
}

#[derive(Serialize, Deserialize)]
pub(crate) enum RpcResponseStatus {
    Success,
    Error,
    Invalid,
}

impl From<RpcResponseStatus> for &str {
    fn from(value: RpcResponseStatus) -> Self {
        match value {
            RpcResponseStatus::Success => "success",
            RpcResponseStatus::Error => "error",
            _ => "invalid",
        }
    }
}

impl From<&str> for RpcResponseStatus {
    fn from(value: &str) -> Self {
        match value {
            "success" => RpcResponseStatus::Success,
            "error" => RpcResponseStatus::Error,
            _ => RpcResponseStatus::Invalid,
        }
    }
}
