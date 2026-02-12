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

use crate::internal_wallet::InternalWallet;

pub async fn get_wallet_address() -> Result<String, String> {
    let address = InternalWallet::tari_address().await;
    let emoji = address.to_emoji_string();
    let hex = address.to_hex();
    let base58 = address.to_base58();

    let result = serde_json::json!({
        "emoji": emoji,
        "base58": base58,
        "hex": hex,
    });
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub async fn get_wallet_balance() -> Result<String, String> {
    Err(
        "Wallet balance query is not yet available. Wallet state access will be enabled in a future update."
            .to_string(),
    )
}

pub async fn get_transaction_history(_limit: Option<u32>) -> Result<String, String> {
    Err(
        "Transaction history query is not yet available. Wallet state access will be enabled in a future update."
            .to_string(),
    )
}
