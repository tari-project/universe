// MIT License
// Copyright (c) 2025 DraviaVemal
// See LICENSE file in the root directory.

use crate::RemoteUi;
use serde::Serialize;
use std::{future::Future, sync::Arc};
use tauri::{Emitter, Error, EventTarget, Manager, Runtime, WebviewWindow};
use tokio::sync::RwLock;

pub trait EmitterExt<R>
where
    R: Runtime,
{
    fn emit<S: Serialize + Clone>(
        &self,
        event: &str,
        payload: S,
    ) -> impl Future<Output = Result<(), Error>>;
    fn emit_to<I, S>(&self, target: I, event: &str, payload: S) -> Result<(), Error>
    where
        I: Into<EventTarget>,
        S: Serialize + Clone;
    fn emit_str(&self, event: &str, payload: String) -> Result<(), Error>;
    fn emit_str_to<I>(&self, target: I, event: &str, payload: String) -> Result<(), Error>
    where
        I: Into<EventTarget>;
    fn emit_filter<S, F>(&self, event: &str, payload: S, filter: F) -> Result<(), Error>
    where
        S: Serialize + Clone,
        F: Fn(&EventTarget) -> bool;
    fn emit_str_filter<F>(&self, event: &str, payload: String, filter: F) -> Result<(), Error>
    where
        F: Fn(&EventTarget) -> bool;
}

impl<R> EmitterExt<R> for WebviewWindow<R>
where
    R: Runtime,
{
    /// "tauri-remote-ui" plugin WS Extension
    async fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> Result<(), Error> {
        let remote_ui = self.state::<Arc<RwLock<RemoteUi>>>();
        if remote_ui.read().await.is_rpc_active() {
            remote_ui.read().await.emit(event, payload.clone())?;
        }
        Emitter::emit(self, event, payload)?;
        Ok(())
    }

    /// This method still use Tauri Yet to be supported in "tauri-remote-ui" plugin
    fn emit_to<I, S>(&self, target: I, event: &str, payload: S) -> Result<(), Error>
    where
        I: Into<EventTarget>,
        S: Serialize + Clone,
    {
        Emitter::emit_to(self, target, event, payload)
    }

    /// This method still use Tauri Yet to be supported in "tauri-remote-ui" plugin
    fn emit_str(&self, event: &str, payload: String) -> Result<(), Error> {
        Emitter::emit_str(self, event, payload)
    }

    /// This method still use Tauri Yet to be supported in "tauri-remote-ui" plugin
    fn emit_str_to<I>(&self, target: I, event: &str, payload: String) -> Result<(), Error>
    where
        I: Into<EventTarget>,
    {
        Emitter::emit_str_to(self, target, event, payload)
    }

    /// This method still use Tauri Yet to be supported in "tauri-remote-ui" plugin
    fn emit_filter<S, F>(&self, event: &str, payload: S, filter: F) -> Result<(), Error>
    where
        S: Serialize + Clone,
        F: Fn(&EventTarget) -> bool,
    {
        Emitter::emit_filter(self, event, payload, filter)
    }

    /// This method still use Tauri Yet to be supported in "tauri-remote-ui" plugin
    fn emit_str_filter<F>(&self, event: &str, payload: String, filter: F) -> Result<(), Error>
    where
        F: Fn(&EventTarget) -> bool,
    {
        Emitter::emit_str_filter(self, event, payload, filter)
    }
}
