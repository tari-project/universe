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

//! Process wrapper sidecar path resolution.
//!
//! This module provides global access to the process wrapper sidecar path.
//! The wrapper is used to monitor parent process death and terminate child
//! processes to prevent orphans when the main app crashes or is force-killed.

use log::{info, warn};
use std::path::PathBuf;
use std::sync::{LazyLock, RwLock};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

use crate::LOG_TARGET_APP_LOGIC;

static WRAPPER_PATH: LazyLock<RwLock<Option<PathBuf>>> = LazyLock::new(|| RwLock::new(None));

fn resolve_sidecar_path(app: &AppHandle) -> Result<PathBuf, anyhow::Error> {
    // Verify the sidecar is configured (this validates externalBin config)
    app.shell()
        .sidecar("process-wrapper")
        .map_err(|e| anyhow::anyhow!("Sidecar 'process-wrapper' not configured: {}", e))?;

    // Resolve path using same logic as Tauri's shell plugin
    let exe_dir = tauri::utils::platform::current_exe()?
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Current executable has no parent directory"))?
        .to_path_buf();

    #[cfg(windows)]
    let sidecar_path = exe_dir.join("process-wrapper.exe");

    #[cfg(not(windows))]
    let sidecar_path = exe_dir.join("process-wrapper");

    Ok(sidecar_path)
}

pub fn initialize_wrapper_path(app: &AppHandle) -> Result<(), anyhow::Error> {
    let program_path = resolve_sidecar_path(app)?;

    let mut path = WRAPPER_PATH
        .write()
        .map_err(|e| anyhow::anyhow!("Failed to acquire write lock: {}", e))?;
    *path = Some(program_path.clone());

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "Process wrapper sidecar initialized at: {:?}", program_path
    );

    Ok(())
}

pub fn get_wrapper_path() -> Option<PathBuf> {
    match WRAPPER_PATH.read() {
        Ok(guard) => guard.clone(),
        Err(e) => {
            warn!(
                target: LOG_TARGET_APP_LOGIC,
                "Failed to read wrapper path: {}", e
            );
            None
        }
    }
}
