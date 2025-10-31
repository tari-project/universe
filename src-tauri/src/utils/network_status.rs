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

use cfspeedtest::speedtest::{test_download, test_latency, test_upload};
use cfspeedtest::OutputFormat;
use log::error;
use log::info;
use std::{panic, sync::LazyLock, time::Duration};
use tokio::sync::watch::{Receiver, Sender};
use tokio::task::spawn_blocking;

use crate::events_emitter::EventsEmitter;

const LOG_TARGET: &str = "tari::universe::network_status";
const SPEED_TEST_TIMEOUT: Duration = Duration::from_secs(60);
// Mb values
const MINIMAL_NETWORK_DOWNLOAD_SPEED: f64 = 1.5;
const MINIMAL_NETWORK_UPLOAD_SPEED: f64 = 1.5;
// 10Mb / 10Mb
const NETWORK_DOWNLOAD_SPEED_PAYLOAD_TEST: usize = 10_000_000;
const NETWORK_UPLOAD_SPEED_PAYLOAD_TEST: usize = 10_000_000;

static INSTANCE: LazyLock<NetworkStatus> = LazyLock::new(NetworkStatus::new);

#[derive(Debug)]
pub struct NetworkStatus {
    sender: Sender<(f64, f64, f64)>,
    receiver: Receiver<(f64, f64, f64)>,
}

impl NetworkStatus {
    pub fn new() -> Self {
        let (sender, receiver) = tokio::sync::watch::channel((0.0, 0.0, 0.0));
        Self { sender, receiver }
    }

    pub fn current() -> &'static NetworkStatus {
        &INSTANCE
    }

    fn is_bandwidth_too_low(&self, download_speed: f64, upload_speed: f64) -> bool {
        download_speed < MINIMAL_NETWORK_DOWNLOAD_SPEED
            || upload_speed < MINIMAL_NETWORK_UPLOAD_SPEED
    }

    pub async fn handle_test_results(&self, download_speed: f64, upload_speed: f64, latency: f64) {
        info!(
            target: LOG_TARGET,
            "Network speed test results: download_speed: {download_speed:.2} MB/s, upload_speed: {upload_speed:.2} MB/s, latency: {latency:.2} ms"
        );
        let is_bandwidth_too_low = self.is_bandwidth_too_low(download_speed, upload_speed);

        let _unused = self
            .sender
            .send((download_speed, upload_speed, latency))
            .inspect_err(|e| {
                error!(target: LOG_TARGET, "Failed to send network speeds: {e:?}");
            });

        EventsEmitter::emit_network_status(
            download_speed,
            upload_speed,
            latency,
            is_bandwidth_too_low,
        )
        .await;
    }

    pub fn get_network_speeds_receiver(&self) -> Receiver<(f64, f64, f64)> {
        self.receiver.clone()
    }

    pub async fn perform_speed_test(&self) -> Result<(f64, f64, f64), anyhow::Error> {
        // TODO: `catch_unwind` has been added because this speedtest lib panics with baked-in .expect()
        // TODO (cont.) see if they fix that in future updates OR if we can remove this dep at some point

        let download_speed = spawn_blocking(|| {
            panic::catch_unwind(|| {
                test_download(
                    &reqwest::blocking::Client::new(),
                    NETWORK_DOWNLOAD_SPEED_PAYLOAD_TEST,
                    OutputFormat::None,
                )
            })
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to perform download speed test: {e:?}");
                0.0
            })
        })
        .await?;

        let upload_speed = spawn_blocking(|| {
            panic::catch_unwind(|| {
                test_upload(
                    &reqwest::blocking::Client::new(),
                    NETWORK_UPLOAD_SPEED_PAYLOAD_TEST,
                    OutputFormat::None,
                )
            })
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to perform upload speed test: {e:?}");
                0.0
            })
        })
        .await?;

        let latency = spawn_blocking(|| {
            panic::catch_unwind(|| test_latency(&reqwest::blocking::Client::new())).unwrap_or_else(
                |e| {
                    error!(target: LOG_TARGET, "Failed to perform latency test: {e:?}");
                    0.0
                },
            )
        })
        .await?;

        Ok((download_speed, upload_speed, latency))
    }

    pub async fn run_speed_test_once(&self) -> Result<(), anyhow::Error> {
        match self.perform_speed_test().await {
            Ok((download_speed, upload_speed, latency)) => {
                self.handle_test_results(download_speed, upload_speed, latency)
                    .await;
                Ok(())
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to perform network speed test: {e:?}");
                Err(e)
            }
        }
    }

    pub async fn run_speed_test_with_timeout(&self) {
        match tokio::time::timeout(SPEED_TEST_TIMEOUT, self.run_speed_test_once()).await {
            Ok(Ok(_)) => info!(target: LOG_TARGET, "Network speed test completed"),
            Ok(Err(error_message)) => {
                let error_message =
                    format!("Failed to perform network speed test: {error_message:?}");
                error!(target: LOG_TARGET, "Failed to perform network speed test: {error_message:?}");
            }
            Err(_) => {
                error!(target: LOG_TARGET, "Network speed test timed out");
            }
        }
    }

    async fn ping_google_server() -> Result<(), anyhow::Error> {
        match reqwest::get("https://www.google.com").await {
            Ok(response) => {
                if response.status().is_success() {
                    info!(target: LOG_TARGET, "Successfully pinged Google server");
                    Ok(())
                } else {
                    Err(anyhow::anyhow!(
                        "Failed to ping Google server: {:?}",
                        response.status()
                    ))
                }
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to ping Google server: {e:?}");
                Err(e.into())
            }
        }
    }

    pub async fn check_internet_connection() -> bool {
        match tokio::time::timeout(Duration::from_secs(5), Self::ping_google_server()).await {
            Ok(result) => match result {
                Ok(_) => {
                    info!(target: LOG_TARGET, "Internet connection is available");
                    true
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "No internet connection: {e:?}");
                    false
                }
            },
            Err(_) => {
                error!(target: LOG_TARGET, "Ping to Google server timed out");
                false
            }
        }
    }
}
