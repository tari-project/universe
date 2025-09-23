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

use crate::process_adapter::{HealthStatus, StatusMonitor};
use crate::wallet::wallet_types::{Balances, Currency, NetworkStatus, WalletBalance, WalletState};
use async_trait::async_trait;
use log::warn;
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::GetStateRequest;
use std::collections::HashMap;
use std::time::Duration;
use tari_common_types::tari_address::TariAddressError;
use tokio::sync::watch;

const LOG_TARGET: &str = "tari::universe::wallet_status_monitor";

pub struct WalletStatusMonitor {
    grpc_port: u16,
    state_broadcast: watch::Sender<Option<WalletState>>,
}

impl Clone for WalletStatusMonitor {
    fn clone(&self) -> Self {
        Self {
            grpc_port: self.grpc_port,
            state_broadcast: self.state_broadcast.clone(),
        }
    }
}

#[async_trait]
impl StatusMonitor for WalletStatusMonitor {
    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match tokio::time::timeout(timeout_duration, self.get_status()).await {
            Ok(status_result) => match status_result {
                Ok(s) => {
                    let _result = self.state_broadcast.send(Some(s));
                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Wallet health check failed: {e}");
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(
                    target: LOG_TARGET,
                    "Wallet health check timed out after {timeout_duration:?}"
                );
                HealthStatus::Warning
            }
        }
    }
}

impl WalletStatusMonitor {
    pub fn new(grpc_port: u16, state_broadcast: watch::Sender<Option<WalletState>>) -> Self {
        Self {
            grpc_port,
            state_broadcast,
        }
    }

    fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
    }

    pub async fn get_status(&self) -> Result<WalletState, WalletStatusMonitorError> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .get_state(GetStateRequest {})
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
        let status = res.into_inner();

        let mut balances = Balances {
            balances: HashMap::new(),
        };
        balances.balances.insert(
            Currency::Xtm,
            WalletBalance::from_option(status.balance).ok_or(
                WalletStatusMonitorError::UnknownError(anyhow::anyhow!(
                    "Failed to get XTM balance"
                )),
            )?,
        );
        Ok(WalletState {
            scanned_height: status.scanned_height,
            balance: Some(balances),
            network: NetworkStatus::from(status.network),
        })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum WalletStatusMonitorError {
    #[error("Wallet not started")]
    WalletNotStarted,
    #[error("Tari address conversion error: {0}")]
    TariAddress(#[from] TariAddressError),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}
