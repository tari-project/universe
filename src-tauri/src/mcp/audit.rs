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

use crate::LOG_TARGET_APP_LOGIC;
use dirs::config_dir;
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::SystemTime;
use tari_common::configuration::Network;
use tokio::sync::RwLock;

use crate::APPLICATION_FOLDER_ID;

const MAX_BUFFER_SIZE: usize = 500;
const MAX_LOG_LINES: usize = 10_000;

static INSTANCE: LazyLock<RwLock<AuditLog>> = LazyLock::new(|| RwLock::new(AuditLog::new()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub timestamp: SystemTime,
    pub tool_name: String,
    pub tier: String,
    pub status: AuditStatus,
    pub duration_ms: Option<u64>,
    pub client_info: Option<String>,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditStatus {
    Started,
    Success,
    Error,
    Denied,
    RateLimited,
}

pub struct AuditLog {
    buffer: VecDeque<AuditEntry>,
    log_path: PathBuf,
    line_count: usize,
}

impl AuditLog {
    fn new() -> Self {
        let log_path = Self::_get_log_path();
        let line_count = Self::_count_lines(&log_path);
        Self {
            buffer: VecDeque::with_capacity(MAX_BUFFER_SIZE),
            log_path,
            line_count,
        }
    }

    pub fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn _get_log_path() -> PathBuf {
        let config_dir = config_dir().unwrap_or_else(std::env::temp_dir);
        config_dir
            .join(APPLICATION_FOLDER_ID)
            .join("app_configs")
            .join(Network::get_current_or_user_setting_or_default().as_key_str())
            .join("mcp_audit.jsonl")
    }

    fn _count_lines(path: &PathBuf) -> usize {
        match File::open(path) {
            Ok(file) => BufReader::new(file).lines().count(),
            Err(_) => 0,
        }
    }

    pub async fn record(entry: AuditEntry) {
        let cloned = entry.clone();
        let mut log = Self::current().write().await;

        // Add to ring buffer
        if log.buffer.len() >= MAX_BUFFER_SIZE {
            log.buffer.pop_front();
        }
        log.buffer.push_back(entry);

        // Check if rotation needed
        if log.line_count >= MAX_LOG_LINES {
            log._rotate();
        }

        let log_path = log.log_path.clone();
        let current_count = &mut log.line_count;

        // Write to file (outside of heavy processing but still within lock for line_count accuracy)
        if let Ok(serialized) = serde_json::to_string(&cloned) {
            if let Some(parent) = log_path.parent() {
                let _unused = fs::create_dir_all(parent);
            }
            match OpenOptions::new().create(true).append(true).open(&log_path) {
                Ok(mut file) => {
                    if writeln!(file, "{serialized}").is_ok() {
                        *current_count += 1;
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to open MCP audit log: {e:?}");
                }
            }
        }
    }

    fn _rotate(&mut self) {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let rotated_path = self.log_path.with_extension(format!("{timestamp}.jsonl"));
        if let Err(e) = fs::rename(&self.log_path, &rotated_path) {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to rotate MCP audit log: {e:?}");
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "Rotated MCP audit log to {rotated_path:?}");
        }
        self.line_count = 0;
    }

    pub async fn get_recent(count: usize) -> Vec<AuditEntry> {
        let log = Self::current().read().await;
        log.buffer.iter().rev().take(count).cloned().collect()
    }

    pub async fn export() -> Result<String, anyhow::Error> {
        let log = Self::current().read().await;
        let path = &log.log_path;
        if path.exists() {
            Ok(fs::read_to_string(path)?)
        } else {
            Ok(String::new())
        }
    }
}
