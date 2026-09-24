// Copyright 2026. The Tari Project
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

//! What the L2 panel shows: accounts with their XTR balance and history, read from the
//! wallet store. The same payload goes out as the L2WalletStateUpdate event and back
//! from the l2_get_state command.

use serde::Serialize;
use tari_ootle_common_types::optional::Optional;
use tari_ootle_wallet_sdk::{
    apis::config::ConfigKey,
    models::{Account, BalanceChange, WalletTransaction},
};
use tari_template_lib::types::{Amount, constants::STEALTH_TARI_RESOURCE_ADDRESS};

use super::OotleSdk;

/// How many balance changes to send per account. The panel only shows recent ones.
const HISTORY_LIMIT: usize = 50;

#[derive(Clone, Debug, Default, Serialize)]
pub struct L2WalletState {
    pub enabled: bool,
    pub accounts: Vec<L2Account>,
}

#[derive(Clone, Debug, Serialize)]
pub struct L2Account {
    pub name: Option<String>,
    /// The Ootle address others send to.
    pub address: String,
    pub component_address: String,
    /// Owner public key, hex. This is the key an L1 burn is claimed with.
    pub public_key: String,
    pub is_default: bool,
    pub balance: L2Balance,
    pub history: Vec<L2BalanceChange>,
    pub transactions: Vec<L2Transaction>,
}

/// XTR in micro units. Revealed sits in the account vault, confidential in stealth UTXOs.
#[derive(Clone, Debug, Serialize)]
pub struct L2Balance {
    pub revealed: u64,
    pub confidential: u64,
}

/// A settled XTR movement on the account, incoming or outgoing.
#[derive(Clone, Debug, Serialize)]
pub struct L2BalanceChange {
    pub id: i32,
    pub transaction_id: Option<String>,
    /// Signed micro XTR, negative when funds left the account.
    pub amount: i64,
    /// "transaction", "scan" or "recovery".
    pub source: &'static str,
    pub timestamp: i64,
}

/// A transaction this wallet submitted, with its current status.
#[derive(Clone, Debug, Serialize)]
pub struct L2Transaction {
    pub id: String,
    pub status: String,
    pub fee: Option<u64>,
    pub invalid_reason: Option<String>,
    pub timestamp: i64,
}

pub fn build_state(sdk: &OotleSdk) -> Result<L2WalletState, anyhow::Error> {
    if !sdk.config_api().exists(ConfigKey::CipherSeed)? {
        return Ok(L2WalletState::default());
    }
    let accounts_api = sdk.accounts_api();
    let count = usize::try_from(accounts_api.count()?)?;
    let accounts = accounts_api
        .get_many(0, count)?
        .into_iter()
        .map(|account| build_account(sdk, account))
        .collect::<Result<_, _>>()?;
    Ok(L2WalletState {
        enabled: true,
        accounts,
    })
}

fn build_account(sdk: &OotleSdk, account: Account) -> Result<L2Account, anyhow::Error> {
    let accounts_api = sdk.accounts_api();
    let component = *account.component_address();
    let revealed = accounts_api
        .get_vault_by_resource(&component, &STEALTH_TARI_RESOURCE_ADDRESS)
        .optional()?
        .map(|vault| vault.revealed_balance)
        .unwrap_or_default();
    let confidential = sdk
        .stealth_outputs_api()
        .get_unspent_balance_for_account_resource(&component, &STEALTH_TARI_RESOURCE_ADDRESS)?;
    let history = accounts_api
        .get_balance_changes(
            &component,
            0,
            HISTORY_LIMIT,
            Some(&STEALTH_TARI_RESOURCE_ADDRESS),
            None,
            None,
        )?
        .changes
        .iter()
        .map(balance_change)
        .collect();
    let transactions = sdk
        .transaction_api()
        .fetch_all(None, Some(component))?
        .iter()
        .filter(|tx| !tx.is_dry_run)
        .map(transaction)
        .collect();
    Ok(L2Account {
        address: accounts_api
            .get_account_by_address(&component)?
            .address
            .to_string(),
        component_address: component.to_string(),
        public_key: hex::encode(account.owner_public_key().as_slice()),
        name: account.name,
        is_default: account.is_default,
        balance: L2Balance {
            revealed: micro(revealed),
            confidential: micro(confidential),
        },
        history,
        transactions,
    })
}

fn micro(amount: Amount) -> u64 {
    amount.to_u64_checked().unwrap_or(u64::MAX)
}

fn balance_change(change: &BalanceChange) -> L2BalanceChange {
    let before = change.revealed_before.to_u128() + change.confidential_before.to_u128();
    let after = change.revealed_after.to_u128() + change.confidential_after.to_u128();
    let amount =
        i64::try_from(after).unwrap_or(i64::MAX) - i64::try_from(before).unwrap_or(i64::MAX);
    L2BalanceChange {
        id: change.id,
        transaction_id: change.transaction_id.map(|id| id.to_string()),
        amount,
        source: change.source.as_key_str(),
        timestamp: change.created_at.assume_utc().unix_timestamp(),
    }
}

fn transaction(tx: &WalletTransaction) -> L2Transaction {
    L2Transaction {
        id: tx.id.to_string(),
        status: tx.status.to_string(),
        fee: tx.final_fee,
        invalid_reason: tx.failure_reason_as_string(),
        timestamp: tx.last_update_time.assume_utc().unix_timestamp(),
    }
}

#[cfg(test)]
mod tests {
    use tari_common::configuration::Network;
    use tari_ootle_wallet_sdk::cipher_seed::CipherSeedRestore;

    use super::*;

    #[test]
    fn state_lists_the_default_account_once_enabled() {
        let dir = tempfile::tempdir().expect("temp dir");
        let url = url::Url::parse("http://127.0.0.1:1").expect("url");
        let mut sdk =
            super::super::open_sdk(dir.path(), Network::Esmeralda, url, "test").expect("sdk");
        let state = build_state(&sdk).expect("state");
        assert!(!state.enabled);
        assert!(state.accounts.is_empty());

        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        let address = sdk.key_manager_api().next_account_address().expect("key");
        sdk.accounts_api()
            .create_account(Some("default"), true, address)
            .expect("account");

        let state = build_state(&sdk).expect("state");
        assert!(state.enabled);
        let [account] = state.accounts.as_slice() else {
            panic!("expected one account, got {:?}", state.accounts);
        };
        assert!(account.is_default);
        assert_eq!(account.name.as_deref(), Some("default"));
        assert_eq!(account.public_key.len(), 64);
        assert_eq!(account.balance.revealed + account.balance.confidential, 0);
        assert!(account.history.is_empty() && account.transactions.is_empty());
    }
}
