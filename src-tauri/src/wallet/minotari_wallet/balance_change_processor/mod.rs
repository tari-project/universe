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

mod balance_calculator;
pub mod errors;
mod output_details_repository;
mod transaction_builder;
mod transaction_matcher;
pub mod types;

use crate::{
    events_emitter::EventsEmitter,
    wallet::{
        minotari_wallet::balance_change_processor::types::{
            BalanceChangeProcessorEmitStrategy, BalanceChangeProcessorStoredTransactions,
            MinotariWalletBalance,
        },
        wallet_types::WalletBalance,
    },
};
use log::{error, info};
use minotari_wallet::{db::AccountBalance, models::BalanceChange};
use sqlx::pool::PoolConnection;
use tari_transaction_components::MicroMinotari;

use balance_calculator::BalanceCalculator;
use errors::ProcessingError;
use output_details_repository::OutputDetailsRepository;
use transaction_builder::TransactionBuilder;
use transaction_matcher::TransactionMatcher;

static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet::balance_change_processor";
pub struct BalanceChangeProcessor {
    pub currently_processed_block_height: u64,
    pub has_more_blocks_to_process: bool,
    pub emit_strategy: BalanceChangeProcessorEmitStrategy,
    pub stored_transactions: BalanceChangeProcessorStoredTransactions,
    pub current_balance: MinotariWalletBalance,
}

impl BalanceChangeProcessor {
    pub fn new(emit_strategy: BalanceChangeProcessorEmitStrategy) -> Self {
        Self {
            has_more_blocks_to_process: true,
            currently_processed_block_height: 0,
            emit_strategy,
            stored_transactions: BalanceChangeProcessorStoredTransactions::default(),
            current_balance: MinotariWalletBalance::new(0),
        }
    }

    fn update_currently_processed_block_height(&mut self, height: u64) {
        self.currently_processed_block_height = height;
    }

    pub fn update_has_more_blocks_to_process(&mut self, has_more: bool) {
        self.has_more_blocks_to_process = has_more;
    }

    pub async fn clear_stored_transactions(&mut self) {
        self.stored_transactions.clear();
        EventsEmitter::emit_wallet_transactions_cleared().await;
    }

    pub async fn clear_current_balance(&mut self) {
        self.current_balance.update(0);
        EventsEmitter::emit_wallet_balance_update(WalletBalance {
            available_balance: MicroMinotari(0),
            timelocked_balance: 0.into(),
            pending_incoming_balance: 0.into(),
            pending_outgoing_balance: 0.into(),
        })
        .await;
    }

    pub fn update_emit_strategy(&mut self, strategy: BalanceChangeProcessorEmitStrategy) {
        self.emit_strategy = strategy;
    }

    pub async fn initialize_balance_from_account_balance(
        &mut self,
        account_balance: AccountBalance,
    ) {
        if let (Some(credits), Some(debits)) =
            (account_balance.total_credits, account_balance.total_debits)
        {
            match BalanceCalculator::calculate_new_balance(0, credits as u64, debits as u64) {
                Ok(new_balance) => {
                    self.current_balance.update(new_balance);
                    Self::emit_balance_update(new_balance).await;
                }
                Err(e) => {
                    error!(
                        target: LOG_TARGET,
                        "Failed to initialize wallet balance from account balance: {}. Setting balance to 0", e
                    );
                    self.current_balance.update(0);
                }
            }
        }
    }

    pub async fn process_balance_change(&mut self, balance_change: &BalanceChange) {
        match BalanceCalculator::calculate_new_balance(
            self.current_balance.balance(),
            balance_change.balance_credit,
            balance_change.balance_debit,
        ) {
            Ok(new_balance) => {
                self.current_balance.update(new_balance);
                Self::emit_balance_update(new_balance).await;
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET,
                    "Failed to calculate new wallet balance after balance change: {}. Staying with the old balance of {}", e, self.current_balance.balance()
                );
            }
        }
    }

    pub async fn initial_transaction_processing(
        &mut self,
        balance_changes: Vec<BalanceChange>,
        database_connection: &mut PoolConnection<sqlx::Sqlite>,
    ) -> Result<(), ProcessingError> {
        for balance_change in balance_changes {
            self.process_wallet_transaction(
                balance_change,
                database_connection,
                true, // during initial processing we assume there are more blocks to process
            )
            .await?;
        }

        self.stored_transactions.emit().await;
        self.emit_strategy = BalanceChangeProcessorEmitStrategy::PerBlock;
        Ok(())
    }

    pub async fn process_wallet_transaction(
        &mut self,
        balance_change: BalanceChange,
        database_connection: &mut PoolConnection<sqlx::Sqlite>,
        has_more_blocks: bool,
    ) -> Result<(), ProcessingError> {
        if self.emit_strategy == BalanceChangeProcessorEmitStrategy::PerBlock
            && self.currently_processed_block_height != balance_change.effective_height
        {
            self.stored_transactions.emit().await;
        };

        self.update_currently_processed_block_height(balance_change.effective_height);
        self.update_has_more_blocks_to_process(has_more_blocks);

        info!(
            target: LOG_TARGET,
            "Processing wallet transaction for balance change at height: {}", balance_change.effective_height
        );

        let output_details =
            OutputDetailsRepository::fetch_all_details(database_connection, &balance_change)
                .await?;

        let input_details = output_details
            .input
            .clone()
            .map(|details| TransactionBuilder::create_input_details(&balance_change, details));

        let output_details = output_details
            .output
            .clone()
            .map(|details| TransactionBuilder::create_output_details(&balance_change, details));

        let transaction_details = input_details.as_ref().or(output_details.as_ref()).ok_or(
            ProcessingError::MissingOutputDetails(
                balance_change.account_id,
                balance_change.effective_height,
            ),
        )?;

        if let Some(mergeable_transaction) = TransactionMatcher::find_mergeable_transaction(
            self.stored_transactions.transactions_mut(),
            &balance_change,
            transaction_details,
        ) {
            info!(
                target: LOG_TARGET,
                "Merging with existing transaction at height: {}", balance_change.effective_height
            );

            TransactionBuilder::merge_operation_into_transaction(
                mergeable_transaction,
                input_details.as_ref(),
                output_details.as_ref(),
            );

            return Ok(()); // Merged into existing, no new transaction
        }

        let new_transaction = TransactionBuilder::build_from_balance_change_and_details(
            &balance_change,
            transaction_details,
        );

        self.stored_transactions
            .add_transaction(new_transaction.clone());

        info!(
            target: LOG_TARGET,
            "Current length of stored transactions: {}", self.stored_transactions.count()
        );

        // No matter which strategy is selected we want to emit stored transactions when all blocks are processed
        if !self.has_more_blocks_to_process {
            self.stored_transactions.emit().await;
        }

        Ok(()) // Return the new transaction
    }

    async fn emit_balance_update(balance: u64) {
        EventsEmitter::emit_wallet_balance_update(WalletBalance {
            available_balance: MicroMinotari(balance),
            timelocked_balance: 0.into(),
            pending_incoming_balance: 0.into(),
            pending_outgoing_balance: 0.into(),
        })
        .await;
    }
}
