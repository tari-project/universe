use std::{sync::LazyLock, time::Duration};

use log::error;
use sysinfo::Networks;
use tauri::{AppHandle, Emitter, Manager};
use tokio::{sync::Mutex, time::interval};
use tokio_util::sync::CancellationToken;

use crate::UniverseAppState;

const LOG_TARGET: &str = "tari::universe::network_status";
const LISTENER_INTERVAL_DURATION: Duration = Duration::from_secs(10);
const MINIMAL_NETWORK_DOWNLOAD_SPEED: u64 = 100000;
const MINIMAL_NETWORK_UPLOAD_SPEED: u64 = 100000;

static INSTANCE: LazyLock<NetworkStatus> = LazyLock::new(NetworkStatus::new);

#[derive(Debug)]
pub struct NetworkStatus {
    cancelation_token: Mutex<CancellationToken>,
    networks: Networks,
}

impl NetworkStatus {
    pub fn new() -> Self {
        Self {
            networks: Networks::new_with_refreshed_list(),
            cancelation_token: Mutex::new(CancellationToken::new()),
        }
    }

    pub fn current() -> &'static NetworkStatus {
        &INSTANCE
    }

    fn get_download_speed(&self) -> Result<u64, anyhow::Error> {
        let networks_total_download: Vec<u64> = self
            .networks
            .iter()
            .map(|(_, network)| network.total_received())
            .collect();

        let download_speed = networks_total_download.iter().sum();

        Ok(download_speed)
    }

    fn get_upload_speed(&self) -> Result<u64, anyhow::Error> {
        let networks_total_upload: Vec<u64> = self
            .networks
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

    pub fn get_networks(&self) -> &Networks {
        &self.networks
    }

    pub async fn cancel_listener(&self) {
        let cancelation_token = self.cancelation_token.lock().await;
        cancelation_token.cancel();
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
                    .inspect_err(|e| {
                        error!("Failed to detect download speed: {:?}", e);
                    })
                    .unwrap_or(previous_download_speed);

                let upload_speed = network_status
                    .get_upload_speed()
                    .inspect_err(|e| {
                        error!("Failed to detect upload speed: {:?}", e);
                    })
                    .unwrap_or(previous_upload_speed);

                previous_download_speed = download_speed;
                previous_upload_speed = upload_speed;

                let is_band_width_too_low =
                    network_status.is_band_width_too_low(download_speed, upload_speed);

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
