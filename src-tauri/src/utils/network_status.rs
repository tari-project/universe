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

use std::{sync::LazyLock, time::Duration};

use log::error;
use sysinfo::Networks;
use tauri::{AppHandle, Manager};
use tokio::{
    sync::{
        watch::{Receiver, Sender},
        Mutex,
    },
    time::interval,
};
use tokio_util::sync::CancellationToken;

use crate::UniverseAppState;

// const LOG_TARGET: &str = "tari::universe::network_status";
const LISTENER_INTERVAL_DURATION: Duration = Duration::from_secs(10);
const MINIMAL_NETWORK_DOWNLOAD_SPEED: u64 = 100000;
const MINIMAL_NETWORK_UPLOAD_SPEED: u64 = 100000;

static INSTANCE: LazyLock<NetworkStatus> = LazyLock::new(NetworkStatus::new);

#[derive(Debug)]
pub struct NetworkStatus {
    cancelation_token: Mutex<CancellationToken>,
    networks: Mutex<Networks>,
    sender: Sender<(u64, u64)>,
    receiver: Receiver<(u64, u64)>,
}

impl NetworkStatus {
    pub fn new() -> Self {
        let (sender, receiver) = tokio::sync::watch::channel((0, 0));
        Self {
            networks: Mutex::new(Networks::new_with_refreshed_list()),
            cancelation_token: Mutex::new(CancellationToken::new()),
            sender,
            receiver,
        }
    }

    pub fn current() -> &'static NetworkStatus {
        &INSTANCE
    }

    async fn get_download_speed(&self) -> Result<u64, anyhow::Error> {
        let mut networks_lock = self.networks.lock().await;
        networks_lock.refresh();
        let networks_total_download: Vec<u64> = networks_lock
            .iter()
            .map(|(_, network)| network.total_received())
            .collect();

        let download_speed = networks_total_download.iter().sum();

        Ok(download_speed)
    }

    async fn get_upload_speed(&self) -> Result<u64, anyhow::Error> {
        let mut networks_lock = self.networks.lock().await;
        networks_lock.refresh();
        let networks_total_upload: Vec<u64> = networks_lock
            .iter()
            .map(|(_, network)| network.total_transmitted())
            .collect();

        let upload_speed = networks_total_upload.iter().sum();

        Ok(upload_speed)
    }

    fn is_band_width_too_low(&self, download_speed: u64, upload_speed: u64) -> bool {
        download_speed < MINIMAL_NETWORK_DOWNLOAD_SPEED
            || upload_speed < MINIMAL_NETWORK_UPLOAD_SPEED
    }

    pub fn format_to_mb(bytes: u64) -> f64 {
        let raw_mb = bytes as f64 / 1024.0 / 1024.0;
        (raw_mb * 100.0).round() / 100.0
    }

    pub async fn cancel_listener(&self) {
        let cancelation_token = self.cancelation_token.lock().await;
        cancelation_token.cancel();
    }

    pub fn get_network_speeds_receiver(&self) -> Receiver<(u64, u64)> {
        self.receiver.clone()
    }

    pub async fn start_listener_for_network_speeds(&self, app_handle: AppHandle) {
        tokio::spawn(async move {
            let network_status = NetworkStatus::current();
            let cancelation_token = network_status.cancelation_token.lock().await;
            let mut interval = interval(LISTENER_INTERVAL_DURATION);

            let mut previous_download_speed: u64 = 0;
            let mut previous_upload_speed: u64 = 0;

            loop {
                interval.tick().await;

                if cancelation_token.is_cancelled() {
                    break;
                }

                let download_speed = network_status
                    .get_download_speed()
                    .await
                    .inspect_err(|e| {
                        error!("Failed to detect download speed: {:?}", e);
                    })
                    .unwrap_or(previous_download_speed);

                let upload_speed = network_status
                    .get_upload_speed()
                    .await
                    .inspect_err(|e| {
                        error!("Failed to detect upload speed: {:?}", e);
                    })
                    .unwrap_or(previous_upload_speed);

                previous_download_speed = download_speed;
                previous_upload_speed = upload_speed;

                let is_band_width_too_low =
                    network_status.is_band_width_too_low(download_speed, upload_speed);

                let _unused = NetworkStatus::current()
                    .sender
                    .send((download_speed, upload_speed))
                    .inspect_err(|e| {
                        error!("Failed to send network speeds: {:?}", e);
                    });

                app_handle
                    .state::<UniverseAppState>()
                    .events_manager
                    .handle_network_status_update(
                        &app_handle,
                        download_speed,
                        upload_speed,
                        is_band_width_too_low,
                    )
                    .await;
            }
        });
    }
}
