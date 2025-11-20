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

use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProcessingError {
    #[error("Balance calculation error: {0}")]
    BalanceCalculation(#[from] BalanceCalculationError),

    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),

    #[error("Address resolution error: {0}")]
    AddressResolution(#[from] AddressResolutionError),

    #[error("Transaction building error: {0}")]
    TransactionBuilding(#[from] TransactionBuildingError),

    #[error("Wallet state error: {0}")]
    WalletState(#[from] WalletStateError),
}

#[derive(Debug, Error)]
pub enum BalanceCalculationError {
    #[error("Balance overflow: cannot add {credit} to {current}")]
    Overflow { current: i64, credit: u64 },

    #[error("Balance underflow: cannot subtract {debit} from {current}")]
    Underflow { current: i64, debit: u64 },
}

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("Database query failed: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Failed to parse output JSON for output {output_id}: {source}")]
    JsonParseFailed {
        output_id: i64,
        #[source]
        source: serde_json::Error,
    },
}

#[derive(Debug, Error)]
pub enum AddressResolutionError {
    #[error("Failed to parse recipient address: {0}")]
    RecipientParseError(String),

    #[error("Failed to parse sender address: {0}")]
    SenderParseError(String),
}

#[derive(Debug, Error)]
pub enum TransactionBuildingError {
    #[error("Invalid transaction amounts: credit={credit}, debit={debit}")]
    InvalidAmounts { credit: u64, debit: u64 },
}

#[derive(Debug, Error)]
pub enum WalletStateError {
    #[error("Duplicate transaction ID: {transaction_id}")]
    DuplicateTransaction { transaction_id: String },

    #[error("Transaction not found: {transaction_id}")]
    TransactionNotFound { transaction_id: String },
}
