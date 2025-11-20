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

mod address_resolver;
mod balance_calculator;
pub mod errors;
mod output_details_repository;
mod transaction_builder;
mod transaction_matcher;
pub mod types;

use crate::{events_emitter::EventsEmitter, wallet::wallet_types::WalletBalance};
use log::{error, info};
use minotari_wallet::models::BalanceChange;
use tari_transaction_components::MicroMinotari;

use address_resolver::AddressResolver;
use balance_calculator::BalanceCalculator;
use errors::ProcessingError;
use output_details_repository::OutputDetailsRepository;
use transaction_builder::TransactionBuilder;
use transaction_matcher::TransactionMatcher;
use types::WalletStateData;

static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet::balance_change_processor";

pub struct BalanceChangeProcessor;

impl BalanceChangeProcessor {
    pub async fn process_balance_change(
        balance_change: &BalanceChange,
        wallet_state: &mut WalletStateData,
    ) {
        match BalanceCalculator::calculate_new_balance(wallet_state.balance(), balance_change) {
            Ok(new_balance) => {
                wallet_state.update_balance(new_balance);
                Self::emit_balance_update(new_balance).await;
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET,
                    "Failed to calculate new wallet balance after balance change: {}. Using last known good balance.", e
                );
                wallet_state.rollback_balance();
                Self::emit_balance_update(wallet_state.balance()).await;
            }
        }
    }

    pub async fn process_wallet_transaction(
        balance_change: BalanceChange,
        wallet_state: &mut WalletStateData,
        get_db_connection: impl std::future::Future<
            Output = Result<sqlx::pool::PoolConnection<sqlx::Sqlite>, anyhow::Error>,
        >,
        owner_tari_address: &str,
    ) -> Result<(), ProcessingError> {
        info!(
            target: LOG_TARGET,
            "Processing wallet transaction for balance change at height: {}", balance_change.effective_height
        );

        let mut conn = get_db_connection.await.map_err(|e| {
            error!(target: LOG_TARGET, "Failed to get database connection: {}", e);
            ProcessingError::Repository(errors::RepositoryError::DatabaseError(
                sqlx::Error::PoolClosed,
            ))
        })?;

        let output_details =
            OutputDetailsRepository::fetch_all_details(&mut conn, &balance_change).await?;

        drop(conn);

        let addresses = AddressResolver::resolve_addresses(&balance_change, owner_tari_address)?;

        let wallet_details = AddressResolver::create_wallet_details(
            &balance_change,
            addresses,
            output_details.received,
            output_details.spent,
        );

        if let Some(mergeable_transaction) = TransactionMatcher::find_mergeable_transaction(
            wallet_state.transactions_mut(),
            &balance_change,
            &wallet_details,
        ) {
            info!(
                target: LOG_TARGET,
                "Merging with existing transaction at height: {}", balance_change.effective_height
            );

            TransactionBuilder::merge_operation_into_transaction(
                mergeable_transaction,
                &balance_change,
                wallet_details,
            );

            Self::emit_transaction_updated(mergeable_transaction.clone()).await;
            return Ok(());
        }

        let new_transaction =
            TransactionBuilder::build_from_balance_change(&balance_change, wallet_details);

        wallet_state.add_transaction(new_transaction.clone())?;

        Self::emit_transaction_created(new_transaction).await;

        Ok(())
    }

    async fn emit_balance_update(balance: i64) {
        EventsEmitter::emit_wallet_balance_update(WalletBalance {
            available_balance: MicroMinotari(balance as u64),
            timelocked_balance: 0.into(),
            pending_incoming_balance: 0.into(),
            pending_outgoing_balance: 0.into(),
        })
        .await;
    }

    async fn emit_transaction_created(
        transaction: crate::wallet::minotari_wallet::minotari_wallet_types::MinotariWalletTransaction,
    ) {
        EventsEmitter::emit_wallet_transactions_found(vec![transaction]).await;
    }

    async fn emit_transaction_updated(
        transaction: crate::wallet::minotari_wallet::minotari_wallet_types::MinotariWalletTransaction,
    ) {
        EventsEmitter::emit_wallet_transaction_updated(transaction).await;
    }
}
