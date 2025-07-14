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

use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::{
    fmt::{Display, Formatter},
    sync::Arc,
};
use tokio::sync::Mutex;
use tungstenite::{connect, Message};

use crate::tasks_tracker::TasksTrackers;

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha_adapter";

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct Job {
    pub job_id: String,
    pub block_height: u64,
    pub difficulty: u64,
    pub timestamp: u64,
}

impl Display for Job {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Job Info:\n\
            ──────────────────────────────────────\n\
            Job ID: {}\n\
            Block Height: {}\n\
            Difficulty: {}\n\
            Timestamp: {}\n\
            ──────────────────────────────────────",
            self.job_id, self.block_height, self.difficulty, self.timestamp
        )
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct Share {
    pub thread_id: u32,
    pub difficulty: u64,
    pub target: u64,
    pub timestamp: u64,
    pub luck_factor: f64,
}

impl Display for Share {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Share Info:\n\
            ──────────────────────────────────────\n\
            Thread ID: {}\n\
            Difficulty: {}\n\
            Target: {}\n\
            Timestamp: {}\n\
            Luck Factor: {}\n\
            ──────────────────────────────────────",
            self.thread_id, self.difficulty, self.target, self.timestamp, self.luck_factor
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct SystemInfo {
    pub cpu_usage: f64,
    pub cpu_cores: u32,
    pub cpu_name: String,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_usage: f64,
    pub os_name: String,
    pub kernel_version: String,
    pub hostname: String,
    pub cpu_temperature: Option<f64>,
    pub max_temperature: f64,
}

impl Display for SystemInfo {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "System Info:\n\
            ──────────────────────────────────────────────────────\n\
            CPU Usage: {:.2}%\n\
            Cores: {}\n\
            CPU Name: {}\n\
            Memory Total: {}\n\
            Memory Used: {}\n\
            Memory Usage: {:.2}%\n\
            OS: {}\n\
            Kernel: {}\n\
            Hostname: {}\n\
            CPU Temp: {:?}\n\
            Max Temp: {:.2}\n\
            ──────────────────────────────────────────────────────",
            self.cpu_usage,
            self.cpu_cores,
            self.cpu_name,
            self.memory_total,
            self.memory_used,
            self.memory_usage,
            self.os_name,
            self.kernel_version,
            self.hostname,
            self.cpu_temperature,
            self.max_temperature
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct PoolInfo {
    pub pool_address: String,
    pub is_connected: bool,
    pub latency_ms: u64,
    pub connection_attempts: u32,
    pub uptime_seconds: u64,
}

impl Display for PoolInfo {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Pool Info:\n\
            ──────────────────────────────────────────────────────\n\
            Pool Address: {}\n\
            Connected: {}\n\
            Latency: {} ms\n\
            Connection Attempts: {}\n\
            Uptime: {} seconds\n\
            ──────────────────────────────────────────────────────",
            self.pool_address,
            self.is_connected,
            self.latency_ms,
            self.connection_attempts,
            self.uptime_seconds
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct GpuInfo {
    pub detected: bool,
    pub name: String,
    pub driver_version: String,
    pub temperature: f64,
    pub power_usage: f64,
    pub memory_used: u64,
    pub memory_total: u64,
    pub utilization: f64,
    pub count: u32,
    pub vendor: String,
    pub error_message: Option<String>,
}

impl Display for GpuInfo {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "GPU Info:\n\
            ──────────────────────────────────────────────────────\n\
            Detected: {}\n\
            Name: {}\n\
            Driver Version: {}\n\
            Temperature: {:.2}°C\n\
            Power Usage: {:.2}W\n\
            Memory Used: {}\n\
            Memory Total: {}\n\
            Utilization: {:.2}%\n\
            Count: {}\n\
            Vendor: {}\n\
            Error Message: {:?}\n\
            ──────────────────────────────────────────────────────",
            self.detected,
            self.name,
            self.driver_version,
            self.temperature,
            self.power_usage,
            self.memory_used,
            self.memory_total,
            self.utilization,
            self.count,
            self.vendor,
            self.error_message
        )
    }
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
    pub active_threads: u32,
    pub share_rate: f64,
    pub total_work: u64,
    pub current_difficulty: u64,
    pub current_job: Option<Job>,
    pub recent_jobs: Vec<Job>,
    pub session_time: u64,
    pub time_since_last_share: u64,
    pub avg_share_time: f64,
    pub acceptance_rate: f64,
    pub recent_shares: Vec<Share>,
    pub top_shares: Vec<u64>,
    pub system_info: SystemInfo,
    pub pool_info: PoolInfo,
    pub gpu_info: GpuInfo,
}

impl Display for WebSocketGpuMinerResponse {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "WebSocket GPU Miner Response:\n\
            ──────────────────────────────────────────────────────────────────────\n\
            Current Hashrate: {}\n\
            Session Average: {}\n\
            Accepted Shares: {}\n\
            Submitted Shares: {}\n\
            Rejected Shares: {}\n\
            Work Efficiency: {:.2}\n\
            Average Luck: {:.2}\n\
            Uptime: {}\n\
            Thread Hashrates: {:?}\n\
            Algorithm: {}\n\
            Active Threads: {}\n\
            Share Rate: {:.2}\n\
            Total Work: {}\n\
            Current Difficulty: {}\n\
            Current Job: {:?}\n\
            Recent Jobs: {:?}\n\
            Session Time: {}\n\
            Time Since Last Share: {}\n\
            Avg Share Time: {:.2}\n\
            Acceptance Rate: {:.2}\n\
            Recent Shares: {:?}\n\
            Top Shares: {:?}\n\
            System Info: {}\n\
            Pool Info: {}\n\
            GPU Info: {}\n\
            ──────────────────────────────────────────────────────────────────────",
            self.current_hashrate,
            self.session_average,
            self.accepted_shares,
            self.submitted_shares,
            self.rejected_shares,
            self.work_efficiency,
            self.average_luck,
            self.uptime,
            self.thread_hashrates,
            self.algorithm,
            self.active_threads,
            self.share_rate,
            self.total_work,
            self.current_difficulty,
            self.current_job.as_ref().map(|job| job.to_string()),
            self.recent_jobs
                .iter()
                .map(|job| job.to_string())
                .collect::<Vec<_>>(),
            self.session_time,
            self.time_since_last_share,
            self.avg_share_time,
            self.acceptance_rate,
            self.recent_shares
                .iter()
                .map(|share| share.to_string())
                .collect::<Vec<_>>(),
            self.top_shares
                .iter()
                .map(|share| share.to_string())
                .collect::<Vec<_>>(),
            self.system_info,
            self.pool_info,
            self.gpu_info
        )
    }
}

#[derive(Debug, Clone)]
pub struct GpuMinerShaWebSocket {
    socket_listener_thread: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    last_message: Arc<Mutex<Option<WebSocketGpuMinerResponse>>>,
}

impl GpuMinerShaWebSocket {
    pub fn new() -> Self {
        Self {
            socket_listener_thread: Arc::new(Mutex::new(None)),
            last_message: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn get_last_message(&self) -> Option<WebSocketGpuMinerResponse> {
        self.last_message.lock().await.clone()
    }

    pub async fn connect(self) {
        if self.socket_listener_thread.lock().await.is_some() {
            warn!(target: LOG_TARGET, "WebSocket listener is already running");
            return;
        }

        if let Ok((mut socket, response)) = connect("ws://localhost:8080/ws") {
            info!(target: LOG_TARGET, "Connected to WebSocket server: {response:?}" );

            let shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;

            let thread = TasksTrackers::current()
                .hardware_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    loop {
                        if shutdown_signal.is_triggered() {
                            info!(target: LOG_TARGET, "Shutdown signal received, stopping WebSocket listener");
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
                                                *self.last_message.lock().await = Some(response.clone());

                                            }
                                            Err(e) => {
                                                warn!(target: LOG_TARGET, "Failed to parse message: {e}");
                                                *self.last_message.lock().await = None;
                                            }
                                        }
                                    }
                                    Message::Close(_) => {
                                        println!("Connection closed by the server");
                                        *self.last_message.lock().await = None;
                                        break;
                                    }
                                    _ => {}
                                }
                            }
                            Err(e) => {
                                warn!(target: LOG_TARGET, "Error reading message: {e}");
                                *self.last_message.lock().await = None;
                                break;
                            }
                        }
                    }
                });

            *self.socket_listener_thread.lock().await = Some(thread);
        } else {
            warn!(target: LOG_TARGET, "Failed to connect to WebSocket server at ws://localhost:8080/ws");
        }
    }
}
