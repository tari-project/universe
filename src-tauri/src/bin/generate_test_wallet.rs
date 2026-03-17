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

//! Generates a test wallet fixture from a deterministic CipherSeed.
//!
//! Run with:
//!   cargo run --bin generate_test_wallet --features test-mode
//!
//! On first run (no SEED_BINARY_HEX env var), generates a new random seed and
//! prints its binary hex. To make deterministic, re-run with:
//!
//!   SEED_BINARY_HEX="<hex>" cargo run --bin generate_test_wallet --features test-mode
//!
//! Outputs:
//!   - The 24 seed words (Tari mnemonic format, English)
//!   - CBOR-serialized Credential bytes as hex
//!   - The expected Tari address (base58) for localnet
//!   - The wallet ID

use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_common_types::seeds::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_transaction_components::key_manager::wallet_types::{SeedWordsWallet, WalletType};
use tari_transaction_components::key_manager::{KeyManager, TransactionKeyManagerInterface};
use tari_utilities::hex::Hex;
use tari_utilities::message_format::MessageFormat;

/// Mirror of the Credential struct from credential_manager.rs.
/// Redefined here so this binary doesn't depend on the main app crate.
#[derive(Serialize, Deserialize, Debug)]
struct Credential {
    encrypted_seed: Vec<u8>,
}

fn seed_words_to_strings(
    seed_words: &tari_common_types::seeds::seed_words::SeedWords,
) -> Vec<String> {
    (0..seed_words.len())
        .map(|i| seed_words.get_word(i).expect("valid index").clone())
        .collect()
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Force localnet
    // SAFETY: Single-threaded binary, no other threads reading env vars.
    unsafe {
        std::env::set_var("TARI_NETWORK", "localnet");
    }

    let cipher_seed = if let Ok(hex_str) = std::env::var("SEED_BINARY_HEX") {
        let seed_binary = hex::decode(&hex_str).expect("Invalid SEED_BINARY_HEX hex");
        CipherSeed::from_binary(&seed_binary).expect("Failed to restore CipherSeed from binary")
    } else {
        eprintln!("No SEED_BINARY_HEX env var set. Generating a new random seed.");
        eprintln!("Re-run with SEED_BINARY_HEX=<hex> for deterministic output.\n");
        CipherSeed::random()
    };

    // Get mnemonic words (Tari format, English)
    let mnemonic = cipher_seed
        .to_mnemonic(MnemonicLanguage::English, None)
        .expect("Failed to convert CipherSeed to mnemonic");
    let mnemonic_words = seed_words_to_strings(&mnemonic);

    // Serialize seed to binary (unencrypted)
    let seed_binary = cipher_seed
        .to_binary()
        .expect("Failed to serialize CipherSeed to binary");

    // Wrap in Credential and CBOR-serialize (mirrors credential_manager.rs)
    let credential = Credential {
        encrypted_seed: seed_binary.clone(),
    };
    let cbor_bytes = serde_cbor::to_vec(&credential).expect("Failed to CBOR-serialize Credential");

    // Derive TariAddress for localnet
    let network = Network::get_current_or_user_setting_or_default();
    let seed_words_wallet =
        SeedWordsWallet::construct_new(cipher_seed).expect("Failed to construct SeedWordsWallet");
    let wallet = WalletType::SeedWords(seed_words_wallet);
    let key_manager = KeyManager::new(wallet).expect("Failed to create KeyManager");

    let comms_pub_key = key_manager.get_spend_key().pub_key;
    let view_key_public = key_manager.get_view_key().pub_key;
    let view_key_private = key_manager.get_private_view_key();

    let tari_address = TariAddress::new_dual_address(
        view_key_public,
        comms_pub_key.clone(),
        network,
        TariAddressFeatures::create_one_sided_only(),
        None,
    )
    .expect("Failed to create TariAddress");

    let wallet_id = "test01";

    // Human-readable output
    println!("=== Test Wallet Fixture ===");
    println!();
    println!("Network: {network}");
    println!();
    println!("Mnemonic ({} words):", mnemonic_words.len());
    println!("  {}", mnemonic_words.join(" "));
    println!();
    println!("Seed binary hex ({} bytes):", seed_binary.len());
    println!("  {}", hex::encode(&seed_binary));
    println!();
    println!("CBOR Credential hex ({} bytes):", cbor_bytes.len());
    println!("  {}", hex::encode(&cbor_bytes));
    println!();
    println!("Tari Address (base58):");
    println!("  {}", tari_address.to_base58());
    println!();
    println!("Wallet ID:");
    println!("  {wallet_id}");
    println!();
    println!("Spend Public Key (hex):");
    println!("  {}", comms_pub_key.to_hex());
    println!();
    println!("View Private Key (hex):");
    println!("  {}", view_key_private.to_hex());
    println!();

    // Machine-readable output for copy-paste into test fixtures
    println!("=== Raw values for test fixtures ===");
    println!("SEED_BINARY_HEX=\"{}\"", hex::encode(&seed_binary));
    println!("CBOR_HEX=\"{}\"", hex::encode(&cbor_bytes));
    println!("TARI_ADDRESS=\"{}\"", tari_address.to_base58());
    println!("WALLET_ID=\"{wallet_id}\"");
    println!("SPEND_KEY=\"{}\"", comms_pub_key.to_hex());
    println!("VIEW_KEY=\"{}\"", view_key_private.to_hex());

    Ok(())
}
