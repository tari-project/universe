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

use crate::wallet::minotari_wallet::minotari_wallet_types::{
    MinotariWalletOutputDetails, WalletOutputFeaturesOnly,
};
use log::warn;
use minotari_wallet::{
    db::{get_input_details_for_balance_change_by_id, get_output_details_for_balance_change_by_id},
    models::{BalanceChange, OutputStatus},
};
use sqlx::Sqlite;

use super::{errors::RepositoryError, types::OutputDetailsPair};

static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet::output_details_repository";

pub struct OutputDetailsRepository;

impl OutputDetailsRepository {
    async fn fetch_received_output_details(
        conn: &mut sqlx::pool::PoolConnection<Sqlite>,
        output_id: i64,
    ) -> Result<Option<MinotariWalletOutputDetails>, RepositoryError> {
        let (confirmed_height, status, wallet_output_json) =
            get_output_details_for_balance_change_by_id(conn, output_id)
                .await
                .map_err(RepositoryError::DatabaseError)?;

        Self::parse_output_details(output_id, confirmed_height, status, wallet_output_json)
    }

    async fn fetch_spent_output_details_by_input(
        conn: &mut sqlx::pool::PoolConnection<Sqlite>,
        input_id: i64,
    ) -> Result<Option<MinotariWalletOutputDetails>, RepositoryError> {
        let output_id = match get_input_details_for_balance_change_by_id(conn, input_id).await {
            Ok(Some(id)) => id,
            Ok(None) => {
                warn!(
                    target: LOG_TARGET,
                    "No output_id found for input {}", input_id
                );
                return Ok(None);
            }
            Err(e) => {
                warn!(
                    target: LOG_TARGET,
                    "Failed to fetch input details for input {}: {}", input_id, e
                );
                return Ok(None);
            }
        };

        let (confirmed_height, status, wallet_output_json) =
            get_output_details_for_balance_change_by_id(conn, output_id)
                .await
                .map_err(RepositoryError::DatabaseError)?;

        Self::parse_output_details(output_id, confirmed_height, status, wallet_output_json)
    }

    fn parse_output_details(
        output_id: i64,
        confirmed_height: Option<u64>,
        status: Option<OutputStatus>,
        wallet_output_json: Option<String>,
    ) -> Result<Option<MinotariWalletOutputDetails>, RepositoryError> {
        match (status, wallet_output_json) {
            (Some(status), Some(json_str)) => {
                let wallet_output: WalletOutputFeaturesOnly =
                    serde_json::from_str(&json_str).map_err(|source| {
                        warn!(
                            target: LOG_TARGET,
                            "Failed to parse wallet output JSON for output {}: {}", output_id, source
                        );
                        RepositoryError::JsonParseFailed { output_id, source }
                    })?;

                Ok(Some(MinotariWalletOutputDetails {
                    confirmed_height,
                    status,
                    output_type: wallet_output.features.output_type,
                    coinbase_extra: wallet_output.features.coinbase_extra.to_string(),
                }))
            }
            _ => Ok(None),
        }
    }

    pub async fn fetch_all_details(
        conn: &mut sqlx::pool::PoolConnection<Sqlite>,
        balance_change: &BalanceChange,
    ) -> Result<OutputDetailsPair, RepositoryError> {
        let received = match balance_change.caused_by_output_id {
            Some(id) => Self::fetch_received_output_details(conn, id).await?,
            None => None,
        };

        let spent = match balance_change.caused_by_input_id {
            Some(id) => Self::fetch_spent_output_details_by_input(conn, id).await?,
            None => None,
        };

        Ok(OutputDetailsPair { received, spent })
    }
}
