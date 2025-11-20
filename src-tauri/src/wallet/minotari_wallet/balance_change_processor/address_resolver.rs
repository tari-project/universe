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
    MinotariWalletDetails, MinotariWalletOutputDetails,
};
use minotari_wallet::models::BalanceChange;
use std::str::FromStr;
use tari_common_types::tari_address::TariAddress;

use super::{errors::AddressResolutionError, types::ResolvedAddressPair};

pub struct AddressResolver;

impl AddressResolver {
    pub fn resolve_addresses(
        balance_change: &BalanceChange,
        owner_address: &str,
    ) -> Result<ResolvedAddressPair, AddressResolutionError> {
        let claimed_recipient_address = balance_change
            .claimed_recipient_address
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or(owner_address);

        let claimed_sender_address = balance_change
            .claimed_sender_address
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or(owner_address);

        let recipient_addr = TariAddress::from_str(claimed_recipient_address).map_err(|e| {
            AddressResolutionError::RecipientParseError(format!(
                "Failed to parse '{}': {}",
                claimed_recipient_address, e
            ))
        })?;

        let sender_addr = TariAddress::from_str(claimed_sender_address).map_err(|e| {
            AddressResolutionError::SenderParseError(format!(
                "Failed to parse '{}': {}",
                claimed_sender_address, e
            ))
        })?;

        Ok(ResolvedAddressPair {
            recipient_base58: recipient_addr.to_base58(),
            recipient_emoji: recipient_addr.to_emoji_string(),
            sender_base58: sender_addr.to_base58(),
            sender_emoji: sender_addr.to_emoji_string(),
        })
    }

    pub fn create_wallet_details(
        balance_change: &BalanceChange,
        addresses: ResolvedAddressPair,
        received_output_details: Option<MinotariWalletOutputDetails>,
        spent_output_details: Option<MinotariWalletOutputDetails>,
    ) -> MinotariWalletDetails {
        MinotariWalletDetails {
            description: balance_change.description.clone(),
            balance_credit: balance_change.balance_credit,
            balance_debit: balance_change.balance_debit,
            claimed_recipient_address: addresses.recipient_base58,
            claimed_recipient_address_emoji: addresses.recipient_emoji,
            claimed_sender_address: addresses.sender_base58,
            claimed_sender_address_emoji: addresses.sender_emoji,
            memo_parsed: balance_change.memo_parsed.clone(),
            memo_hex: balance_change.memo_hex.clone(),
            claimed_fee: balance_change.claimed_fee.unwrap_or(0),
            claimed_amount: balance_change.claimed_amount,
            recieved_output_details: received_output_details,
            spent_output_details,
        }
    }
}
