// MIT License
// Copyright (c) 2025 DraviaVemal
// See LICENSE file in the root directory.

use crate::{RpcServer, WsPayload};
use futures::{stream::SplitSink, SinkExt};
use hyper::upgrade::Upgraded;
use hyper_tungstenite::{tungstenite::Message, WebSocketStream};
use hyper_util::rt::TokioIo;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::json;
use std::sync::Arc;
use tauri::{plugin::PluginApi, AppHandle, Error, Listener, Manager, Runtime};
use tokio::sync::{Mutex, RwLock};

pub fn init<R, C>(app: &AppHandle, _api: PluginApi<R, C>) -> crate::Result<Arc<RwLock<RemoteUi>>>
where
    C: DeserializeOwned,
    R: Runtime,
{
    let app_handle = Arc::new(app.clone());
    let remote_ui = Arc::new(RwLock::new(RemoteUi {
        app: app_handle.clone(),
        rpc_server: RpcServer::new(app_handle),
    }));
    Ok(remote_ui)
}

#[derive(Debug, Clone)]
/// Access to the remote-ui APIs.
pub struct RemoteUi {
    pub(crate) app: Arc<AppHandle>,
    pub(crate) rpc_server: RpcServer,
}

impl RemoteUi {
    pub(crate) fn is_rpc_active(&self) -> bool {
        self.rpc_server.get_is_active()
    }

    pub(crate) fn invoke_rpc(
        &self,
        payload: String,
        session: Arc<Mutex<SplitSink<WebSocketStream<TokioIo<Upgraded>>, Message>>>,
    ) -> Result<(), Error> {
        let ws_payload: WsPayload = serde_json::from_str(&payload)?;
        let window = self
            .app
            .get_webview_window("main")
            .ok_or(Error::AssetNotFound("WebviewWindow Not Found".to_owned()))?;
        let req_unique_id = format!("remote-ui::result::{}", &ws_payload.id);
        self.app
            .app_handle()
            .once_any(&req_unique_id, move |handler| {
                // Spawn a new task to send the message asynchronously
                let payload = handler.payload().to_string();
                let id = ws_payload.id;
                tauri::async_runtime::spawn(async move {
                    if let Err(err) = session
                        .lock()
                        .await
                        .send(Message::text(
                            json!({"id":id,"payload":payload}).to_string(),
                        ))
                        .await
                    {
                        eprintln!("WS Send Message Failed. Err:{err}");
                    }
                });
            });
        let js = format!(
            r#"
            window.__TAURI_INTERNALS__.invoke("{}",{},{})
                .then((res) => {{
                        window.__TAURI_INTERNALS__.invoke("plugin:event|emit",{{
                        event:"{}",
                        payload:{{
                            status: "success",
                            payload:res
                        }}
                    }})
                }})
                .catch((err) => {{
                    window.__TAURI_INTERNALS__.invoke("plugin:event|emit",{{
                        event:"{}",
                        payload:{{
                            status: "error",
                            payload:err
                        }}
                    }})
                }});
            "#,
            ws_payload.cmd,
            serde_json::to_string(&ws_payload.args).unwrap(),
            serde_json::to_string(&ws_payload.option).unwrap(),
            &req_unique_id,
            &req_unique_id
        );
        window.eval(js)?;
        Ok(())
    }

    /// Emit message to all connected WebSocket clients.
    ///
    /// Patched vs upstream 0.14.0:
    /// - broadcasts to every live connection instead of a single
    ///   latest-wins handle
    /// - a failed send is logged and the dead connection pruned, instead
    ///   of `.unwrap()` panicking the send task
    pub fn emit<P: Serialize + Clone>(&self, event: &str, payload: P) -> Result<(), Error> {
        let connections = self.rpc_server.connections.clone();
        let json = json!({
            "event": event,
            "payload": payload
        })
        .to_string();
        tauri::async_runtime::spawn(async move {
            let snapshot: Vec<(u64, crate::WsSink)> = connections
                .lock()
                .await
                .iter()
                .map(|(id, sink)| (*id, sink.clone()))
                .collect();
            for (conn_id, sink) in snapshot {
                if let Err(err) = sink.lock().await.send(Message::text(json.clone())).await {
                    log::warn!("WS send failed (conn_id={conn_id}), pruning connection. Err:{err}");
                    connections.lock().await.remove(&conn_id);
                }
            }
        });
        Ok(())
    }
}
