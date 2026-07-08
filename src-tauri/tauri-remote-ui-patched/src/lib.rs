// MIT License
// Copyright (c) 2025 DraviaVemal
// See LICENSE file in the root directory.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Wry,
};

pub use models::*;

mod error;
mod models;
pub mod remote_ui;
pub use error::{Error, Result};
pub use remote_ui::*;

/// Initializes the remote-ui Tauri plugin.
pub fn init() -> TauriPlugin<Wry> {
    Builder::new("remote-ui")
        .setup(|app, api| {
            let remote_ui = remote_ui::init(app, api)?;
            app.manage(remote_ui);
            Ok(())
        })
        .build()
}
