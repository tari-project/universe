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

//! Regression tests for the redaction of the wallet view private key
//! (GHSA-3wv6-9vwg-865r).
//!
//! `ConfigWalletContent` derives `Debug` and holds the view private key, so a
//! single `{:?}` on the config content used to be enough to write the key to a
//! log file. The key still has to be stored as plain hex, so only the `Debug`
//! output is masked.

use std::str::FromStr;

use tari_common_types::tari_address::TariAddress;

use super::config_wallet::{ConfigWalletContent, WalletId};
use crate::internal_wallet::{TariWalletDetails, ViewPrivateKeyHex};

const TEST_TARI_ADDRESS: &str =
    "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
const VIEW_KEY_SENTINEL: &str = "view_key_sentinel_0123";

fn sentinel_wallet_details() -> TariWalletDetails {
    TariWalletDetails {
        id: WalletId::new("wallet_sentinel_id".to_string()),
        tari_address: TariAddress::from_str(TEST_TARI_ADDRESS).expect("valid test address"),
        wallet_birthday: 1234,
        view_private_key_hex: ViewPrivateKeyHex::new(VIEW_KEY_SENTINEL.to_string()),
        spend_public_key_hex: "spend_public_key_not_secret".to_string(),
    }
}

fn sentinel_config_content() -> ConfigWalletContent {
    let mut content = ConfigWalletContent::default();
    content.set_tari_wallet_details(Some(sentinel_wallet_details()));
    content
}

#[test]
fn config_wallet_content_debug_redacts_view_private_key() {
    let debug_output = format!("{:?}", sentinel_config_content());

    assert!(
        !debug_output.contains("view_key_sentinel"),
        "view private key leaked into Debug output: {debug_output}"
    );
    assert!(debug_output.contains("REDACTED"), "{debug_output}");
}

#[test]
fn config_wallet_content_serialization_keeps_the_plain_key() {
    let serialized =
        serde_json::to_value(sentinel_config_content()).expect("content should serialize");

    assert_eq!(
        serialized
            .get("tari_wallet_details")
            .and_then(|details| details.get("view_private_key_hex"))
            .and_then(serde_json::Value::as_str),
        Some(VIEW_KEY_SENTINEL),
        "config_wallet.json must keep the plain hex key"
    );
}
