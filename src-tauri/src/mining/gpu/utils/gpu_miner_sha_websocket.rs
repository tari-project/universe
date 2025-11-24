// Copyright 2025. The Tari Project
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

use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tungstenite::{connect, Message};

use crate::{mining::gpu::miners::GpuVendor, tasks_tracker::TasksTrackers, LOG_TARGET_STATUSES};

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct JobInfo {
    pub job_id: String,
    pub block_height: u64,
    pub difficulty: u64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct WebSocketShare {
    pub thread_id: usize,
    pub difficulty: u64,
    pub target: u64,
    pub timestamp: u64,
    pub luck_factor: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f32,
    pub cpu_cores: usize,
    pub cpu_name: String,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_usage: f64,
    pub os_name: Option<String>,
    pub kernel_version: Option<String>,
    pub hostname: Option<String>,
    pub cpu_temperature: Option<f32>,
    pub max_temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct PoolInfo {
    pub pool_address: String,
    pub is_connected: bool,
    pub latency_ms: Option<u64>,
    pub connection_attempts: u32,
    pub uptime_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct GpuInfo {
    pub detected: bool,
    pub name: String,
    pub driver_version: Option<String>,
    pub temperature: Option<f32>,
    pub power_usage: Option<f32>,
    pub memory_used: Option<u64>,
    pub memory_total: Option<u64>,
    pub utilization: Option<f32>,
    pub count: usize,
    pub vendor: GpuVendor,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketGpuMinerResponse {
    pub current_hashrate: u64,
    pub session_average: u64,
    pub accepted_shares: u64,
    pub submitted_shares: u64,
    pub rejected_shares: u64,
    pub work_efficiency: f64,
    pub average_luck: f64,
    pub uptime: u64,
    pub thread_hashrates: Vec<u64>,
    pub algorithm: String,
    pub active_threads: usize,
    pub share_rate: f64,
    pub total_work: u64,
    pub current_difficulty: u64,
    pub current_job: JobInfo,
    pub recent_jobs: Vec<JobInfo>,
    pub session_time: u64,
    pub time_since_last_share: u64,
    pub avg_share_time: f64,
    pub acceptance_rate: f64,
    pub recent_shares: Vec<WebSocketShare>,
    pub top_shares: Vec<u64>,
    pub system_info: SystemInfo,
    pub pool_info: PoolInfo,
    pub gpu_info: GpuInfo,
}

#[derive(Debug, Clone)]
pub struct GpuMinerShaWebSocket {
    socket_listener_thread: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    last_message: Arc<Mutex<Option<WebSocketGpuMinerResponse>>>,
    port: u16,
}

impl GpuMinerShaWebSocket {
    pub fn new(port: u16) -> Self {
        Self {
            socket_listener_thread: Arc::new(Mutex::new(None)),
            last_message: Arc::new(Mutex::new(None)),
            port,
        }
    }

    pub async fn get_last_message(&self) -> Option<WebSocketGpuMinerResponse> {
        self.last_message.lock().await.clone()
    }

    pub async fn connect(self) {
        if self.socket_listener_thread.lock().await.is_some() {
            debug!(target: LOG_TARGET_STATUSES, "WebSocket listener is already running");
            return;
        }

        if let Ok((mut socket, response)) = connect(format!("ws://localhost:{}/ws", self.port)) {
            info!(target: LOG_TARGET_STATUSES, "Connected to WebSocket server: {response:?}" );

            let shutdown_signal = TasksTrackers::current().gpu_mining_phase.get_signal().await;

            let last_message = Arc::clone(&self.last_message);
            let socket_listener_thread = Arc::clone(&self.socket_listener_thread);

            let thread = TasksTrackers::current()
                .gpu_mining_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    loop {
                        if shutdown_signal.is_triggered() {
                            info!(target: LOG_TARGET_STATUSES, "Shutdown signal received, stopping WebSocket listener");
                            break;
                        }

                        match socket.read() {
                            Ok(msg) => {
                                match msg {
                                    Message::Text(text) => {
                                        let parsed_message: Result<
                                            WebSocketGpuMinerResponse,
                                            serde_json::Error,
                                        > = serde_json::from_str(&text);

                                        match parsed_message {
                                            Ok(response) => {
                                                *last_message.lock().await = Some(response.clone());

                                            }
                                            Err(e) => {
                                            if !last_message.lock().await.is_none() {
                                                info!(target: LOG_TARGET_STATUSES, "Received message: {text}");
                                            }
                                                warn!(target: LOG_TARGET_STATUSES, "Failed to parse message: {e}");
                                                *last_message.lock().await = None;
                                            }
                                        }
                                    }
                                    Message::Close(_) => {
                                        println!("Connection closed by the server");
                                        *last_message.lock().await = None;
                                        break;
                                    }
                                    _ => {}
                                }
                            }
                            Err(e) => {
                                warn!(target: LOG_TARGET_STATUSES, "Error reading message: {e}");
                                *last_message.lock().await = None;
                                break;
                            }
                        }
                    }

                    *socket_listener_thread.lock().await = None;
                });

            *self.socket_listener_thread.lock().await = Some(thread);
        } else {
            warn!(target: LOG_TARGET_STATUSES, "Failed to connect to WebSocket server at ws://localhost:{}/ws", self.port);
        }
    }
}
