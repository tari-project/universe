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

//! Claiming L1 burns into an L2 account, the way tari_walletd's claim burn handler does
//! it: check the burn's ownership proof against the account's derived claim key, decrypt
//! the burned output, and mint it straight into a stealth output the account owns.

use std::{collections::HashSet, iter, path::Path, time::SystemTime};

use anyhow::{anyhow, bail};
use base64::{Engine, prelude::BASE64_STANDARD};
use log::warn;
use serde::{Deserialize, Serialize};
use tari_crypto::{
    keys::PublicKey as _,
    ristretto::{RistrettoPublicKey, RistrettoSecretKey},
    tari_utilities::ByteArray,
};
use tari_engine_types::confidential::{ClaimBurnOutputData, MinotariBurnClaimProof};
use tari_ootle_common_types::{Epoch, optional::Optional};
use tari_ootle_transaction::{Transaction, TransactionId};
use tari_ootle_wallet_sdk::{
    crypto::{OutputWitness, StealthInputWitness, StealthOutputWitness, memo::Memo},
    models::{
        AccountWithAddress, KeyBranch, TransactionContext, TransactionContextKind, WalletEvent,
        WalletSecretKey,
    },
    network::WalletNetworkInterface,
};
use tari_ootle_wallet_sdk_services::transaction_service::TransactionServiceHandle;
use tari_template_lib::{
    prelude::RistrettoPublicKeyBytes,
    types::{
        EncryptedData,
        constants::{STEALTH_TARI_RESOURCE_ADDRESS, TARI_TOKEN},
        stealth::SpendAuthorization,
    },
};

use super::{LOG_TARGET, OotleSdk, send::VALIDITY_EPOCHS};

/// Claimed proof files move here, the same place tari_walletd puts them.
const CLAIMED_DIR: &str = "claimed";
/// Proof files are small. Same cap as tari_walletd.
const MAX_PROOF_BYTES: u64 = 1 << 20;

/// A burn to L2 and how far along its claim is.
#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct L2Burn {
    /// Hex, the burned output's commitment.
    pub commitment: String,
    /// Hex, the L2 key the burn can be claimed by.
    pub claim_public_key: String,
    /// Micro XTM burned, which becomes micro XTR on L2 less the claim fee.
    pub amount: u64,
    /// File name of the proof inside the burn proof directory, once it's written.
    pub proof_file: Option<String>,
    /// "pending" until the burn is mined and its proof written, then "claimable", then
    /// "claimed" once a claim is accepted on L2.
    pub status: &'static str,
}

impl L2Burn {
    /// A burn the L1 wallet has broadcast but has no complete proof for yet.
    pub fn pending(commitment: String, claim_public_key: String, amount: u64) -> Self {
        Self {
            commitment,
            claim_public_key,
            amount,
            proof_file: None,
            status: "pending",
        }
    }
}

/// The proof file the L1 burn proof worker writes, in the JSON tari_walletd reads.
#[derive(Deserialize)]
pub struct BurnProof {
    pub claim_proof: MinotariBurnClaimProof,
    /// Base64.
    encrypted_data: String,
}

impl BurnProof {
    fn encrypted_data(&self) -> Result<EncryptedData, anyhow::Error> {
        let bytes = BASE64_STANDARD.decode(&self.encrypted_data)?;
        EncryptedData::try_from(bytes)
            .map_err(|len| anyhow!("The burn proof's encrypted data is {len} bytes, too long"))
    }
}

/// Every burn the panel knows about, newest first: proof files in `dir` are claimable,
/// those in its claimed directory are claimed, and `pending` rows (oldest first, as the
/// wallet db returns them) without a proof file yet stay pending. Pending burns aren't
/// mined yet, so they go ahead of every burn with a proof.
pub fn list_burns(dir: &Path, pending: Vec<L2Burn>) -> Result<Vec<L2Burn>, anyhow::Error> {
    let mut files = read_burns(dir, "claimable")?;
    files.extend(read_burns(&dir.join(CLAIMED_DIR), "claimed")?);
    files.sort_by_key(|(modified, _)| std::cmp::Reverse(*modified));
    let known: HashSet<String> = files.iter().map(|(_, b)| b.commitment.clone()).collect();
    Ok(pending
        .into_iter()
        .rev()
        .filter(|b| !known.contains(&b.commitment))
        .chain(files.into_iter().map(|(_, burn)| burn))
        .collect())
}

/// The claimable proof for `commitment` and its file name.
pub fn find_claimable(dir: &Path, commitment: &str) -> Result<(String, BurnProof), anyhow::Error> {
    let file = read_burns(dir, "claimable")?
        .into_iter()
        .map(|(_, burn)| burn)
        .find(|burn| burn.commitment == commitment)
        .and_then(|burn| burn.proof_file)
        .ok_or_else(|| anyhow!("No claimable burn with commitment {commitment}"))?;
    let proof = read_proof(&dir.join(&file))?;
    Ok((file, proof))
}

/// The burns with a proof file in `dir`, each with when its file was last modified.
fn read_burns(
    dir: &Path,
    status: &'static str,
) -> Result<Vec<(SystemTime, L2Burn)>, anyhow::Error> {
    let entries = match std::fs::read_dir(dir) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        entries => entries?,
    };
    let mut burns = Vec::new();
    for path in entries.map(|entry| entry.map(|e| e.path())) {
        let path = path?;
        let Some(file) = path.file_name().and_then(|name| name.to_str()) else {
            continue;
        };
        if !path.is_file() || !file.ends_with(".json") {
            continue;
        }
        match read_proof(&path) {
            Ok(proof) => burns.push((
                std::fs::metadata(&path)?.modified()?,
                L2Burn {
                    commitment: hex::encode(proof.claim_proof.commitment.as_bytes()),
                    claim_public_key: hex::encode(proof.claim_proof.burn_public_key.as_bytes()),
                    amount: proof.claim_proof.value,
                    proof_file: Some(file.to_string()),
                    status,
                },
            )),
            Err(e) => warn!(target: LOG_TARGET, "Skipping burn proof {file}: {e}"),
        }
    }
    Ok(burns)
}

fn read_proof(path: &Path) -> Result<BurnProof, anyhow::Error> {
    if std::fs::metadata(path)?.len() > MAX_PROOF_BYTES {
        bail!("The burn proof file is too large");
    }
    Ok(serde_json::from_slice(&std::fs::read(path)?)?)
}

/// Moves the proof file of an accepted claim into the claimed directory. `claims` maps
/// submitted claim transactions to their proof file.
pub fn track_claim(
    dir: &Path,
    claims: &mut std::collections::HashMap<TransactionId, String>,
    event: &WalletEvent,
) {
    match event {
        WalletEvent::TransactionSubmitted(event) => {
            if let Some(TransactionContextKind::ClaimBurn { file_name }) =
                event.context.as_ref().and_then(|c| c.kind.as_ref())
            {
                claims.insert(event.transaction_id, file_name.clone());
            }
        }
        WalletEvent::TransactionFinalized(event) => {
            let Some(file) = claims.remove(&event.transaction_id) else {
                return;
            };
            if event.finalize.result.any_accept().is_none() {
                warn!(target: LOG_TARGET, "Claim of {file} was not accepted, it stays claimable");
                return;
            }
            let moved = std::fs::create_dir_all(dir.join(CLAIMED_DIR))
                .and_then(|()| std::fs::rename(dir.join(&file), dir.join(CLAIMED_DIR).join(&file)));
            if let Err(e) = moved {
                warn!(target: LOG_TARGET, "Could not mark {file} claimed: {e}");
            }
        }
        WalletEvent::TransactionInvalid(event) => {
            claims.remove(&event.transaction_id);
        }
        _ => {}
    }
}

/// Claims the burn in `proof` into the wallet account its claim key belongs to and
/// returns the L2 transaction id. Dry runs at a fee of 1 first, like tari_walletd's
/// auto claim, and submits at the fee the dry run asks for.
pub async fn claim_burn(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    proof: BurnProof,
    file_name: String,
) -> Result<TransactionId, anyhow::Error> {
    let claim_key = proof.claim_proof.burn_public_key;
    let account = sdk
        .accounts_api()
        .get_account_by_public_key(&claim_key)
        .optional()?
        .ok_or_else(|| {
            anyhow!("The claim key {claim_key} isn't one of this wallet's L2 accounts")
        })?;
    let encrypted_data = proof.encrypted_data()?;
    let epoch = sdk.get_network_interface().get_current_epoch().await?;
    let max_epoch = Epoch(epoch.as_u64().saturating_add(VALIDITY_EPOCHS));
    let build = |fee, dry_run| {
        let claim = Claim {
            account: &account,
            proof: &proof.claim_proof,
            encrypted_data: &encrypted_data,
            max_fee: fee,
            max_epoch,
            dry_run,
        };
        build_claim(sdk, claim)
    };

    let result = transactions
        .submit_dry_run_transaction(build(1, true)?)
        .await
        .map_err(|e| anyhow!("The claim fee estimate failed: {e}"))?;
    if let Some(reason) = result.finalize.any_reject() {
        bail!("The claim would be rejected: {reason}");
    }
    let transaction = build(result.finalize.required_fees(), false)?;
    let context = TransactionContext::with_accounts([*account.component_address()])
        .with_kind(TransactionContextKind::ClaimBurn { file_name });
    transactions
        .submit_transaction_with_opts(transaction, Some(context), None)
        .await
        .map_err(|e| anyhow!("The claim was not submitted: {e}"))
}

struct Claim<'a> {
    account: &'a AccountWithAddress,
    proof: &'a MinotariBurnClaimProof,
    encrypted_data: &'a EncryptedData,
    max_fee: u64,
    max_epoch: Epoch,
    dry_run: bool,
}

/// Builds and signs the claim: mint the burned output, then spend it into a stealth
/// output for the account, revealing `max_fee` to pay the fee.
fn build_claim(sdk: &OotleSdk, claim: Claim<'_>) -> Result<Transaction, anyhow::Error> {
    let network = sdk.network();
    let crypto = sdk.stealth_crypto_api();
    let keys = sdk.key_manager_api();
    let (owner, stealth_secret, sender_offset) = claim_keys(sdk, claim.account, claim.proof)?;
    let decrypted = crypto.decrypt_utxo_data(
        claim.encrypted_data,
        &claim.proof.commitment,
        owner.secret(),
        &sender_offset,
        true,
    )?;
    let amount = decrypted
        .value()
        .checked_sub(claim.max_fee)
        .filter(|amount| *amount > 0)
        .ok_or_else(|| anyhow!("The claim fee is as large as the burn"))?;

    let mask = keys.next_key(KeyBranch::StealthMask)?;
    let (nonce, public_nonce) = RistrettoPublicKey::random_keypair(&mut rand::rng());
    let view_only = keys.get_public_key(claim.account.view_only_key_id())?;
    let memo = Memo::new_message("Burnt funds claimed from L1")
        .ok_or_else(|| anyhow!("The claim memo is too long"))?;
    let encrypted_output = crypto.encrypt_value_and_mask(
        amount,
        &mask.key,
        view_only.public_key(),
        &nonce,
        Some(&memo),
    )?;
    let tag = crypto.derive_stealth_output_tag(
        network,
        &nonce,
        view_only.public_key(),
        &STEALTH_TARI_RESOURCE_ADDRESS,
    );
    let owner_key = crypto.derive_stealth_owner_public_key(network, &owner.to_public_key(), &nonce);
    let output = StealthOutputWitness {
        witness: OutputWitness {
            amount,
            mask: mask.key,
            sender_public_nonce: public_nonce,
            minimum_value_promise: 0,
            encrypted_data: encrypted_output,
            resource_view_key: None,
        },
        auth: SpendAuthorization::Key(RistrettoPublicKeyBytes::try_from(owner_key.as_bytes())?),
        tag,
    };
    let input = StealthInputWitness::new(decrypted.into_mask_and_value());
    let statement = crypto.generate_transfer_statement(
        iter::once(input),
        0,
        iter::once(&output),
        claim.max_fee,
    )?;
    let output_data = ClaimBurnOutputData {
        encrypted_data: claim.encrypted_data.clone(),
    };
    let transaction = Transaction::builder(network.as_byte(), claim.max_epoch)
        .with_fee_instructions_builder(|builder| {
            builder
                .claim_burn(claim.proof.clone(), output_data)
                .stealth_transfer(TARI_TOKEN, statement)
                .put_last_instruction_output_on_workspace("fee")
                .pay_fee_from_bucket("fee")
        })
        .with_dry_run(claim.dry_run)
        .finish();
    Ok(sdk
        .signer_api()
        .sign_with_explicit_key(&stealth_secret, transaction)?)
}

/// The account's owner key, the stealth claim secret `s = H(p·R) + p` and the burn's
/// sender offset key `R`. Fails unless the burn's ownership proof was made for `s·G`,
/// which is the check the network makes too.
fn claim_keys(
    sdk: &OotleSdk,
    account: &AccountWithAddress,
    proof: &MinotariBurnClaimProof,
) -> Result<(WalletSecretKey, RistrettoSecretKey, RistrettoPublicKey), anyhow::Error> {
    let key_id = account
        .owner_key_id()
        .ok_or_else(|| anyhow!("This L2 account has no owner key to claim with"))?;
    let owner = sdk.key_manager_api().get_key(key_id)?;
    let sender_offset =
        RistrettoPublicKey::from_canonical_bytes(proof.sender_offset_public_key.as_bytes())
            .map_err(|e| anyhow!("The burn proof has a bad sender offset key: {e}"))?;
    let crypto = sdk.stealth_crypto_api();
    let stealth_secret = crypto.derive_burn_claim_stealth_secret(owner.secret(), &sender_offset);
    let stealth_key = RistrettoPublicKeyBytes::try_from(
        RistrettoPublicKey::from_secret_key(&stealth_secret).as_bytes(),
    )?;
    if !crypto.validate_burn_claim_ownership_proof(
        sdk.network(),
        &proof.ownership_proof,
        &proof.commitment,
        proof.value,
        &stealth_key,
    ) {
        bail!(
            "ownership proof validation failed: the burn's ownership proof wasn't made for this account's claim key"
        );
    }
    Ok((owner, stealth_secret, sender_offset))
}

#[cfg(test)]
mod tests {
    use tari_common::configuration::Network;
    use tari_ootle_wallet_sdk::cipher_seed::CipherSeedRestore;

    use super::*;

    /// A real esmeralda burn proof written by the burn proof worker (1000 XTM, claim key
    /// of a tari_walletd account, not of any wallet made here).
    const PROOF: &str = include_str!("test_burn_proof.json");
    const COMMITMENT: &str = "dae29ac8a7d02f1adc193c5c68cab83a33d2dff3f7ac78c5c3434f5189126f42";
    const CLAIM_KEY: &str = "7c29fa218284a767bedb04b2fb44e55fa22fc01c201b56f30d1d79357a2e4d76";

    fn write(dir: &Path, name: &str, contents: &str) {
        std::fs::create_dir_all(dir).expect("dir");
        std::fs::write(dir.join(name), contents).expect("write");
    }

    /// The fixture with its commitment swapped, so it reads as a different burn.
    fn other_proof(commitment: &str) -> String {
        let mut json: serde_json::Value = serde_json::from_str(PROOF).expect("json");
        json["claim_proof"]["commitment"] = commitment.into();
        json.to_string()
    }

    #[test]
    fn reads_the_burn_proof_workers_file() {
        let proof: BurnProof = serde_json::from_str(PROOF).expect("proof");
        assert_eq!(
            hex::encode(proof.claim_proof.commitment.as_bytes()),
            COMMITMENT
        );
        assert_eq!(
            hex::encode(proof.claim_proof.burn_public_key.as_bytes()),
            CLAIM_KEY
        );
        assert_eq!(proof.claim_proof.value, 1_000_000_000);
        assert!(proof.encrypted_data().is_ok());
    }

    #[test]
    fn burn_status_comes_from_where_its_proof_is() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let claimed = "11".repeat(32);
        let pending = "22".repeat(32);
        write(dir, &format!("{CLAIM_KEY}-{COMMITMENT}.json"), PROOF);
        write(dir, "broken.json", "{}");
        write(dir, "notes.txt", "not a proof");
        write(&dir.join(CLAIMED_DIR), "done.json", &other_proof(&claimed));

        let burns = list_burns(
            dir,
            vec![
                // The worker wrote this one's file already, so the file wins.
                L2Burn::pending(COMMITMENT.to_string(), CLAIM_KEY.to_string(), 1),
                L2Burn::pending(pending.clone(), CLAIM_KEY.to_string(), 5),
            ],
        )
        .expect("burns");

        let status = |commitment: &str| {
            let found: Vec<_> = burns
                .iter()
                .filter(|b| b.commitment == commitment)
                .collect();
            assert_eq!(found.len(), 1, "{commitment} listed once in {burns:?}");
            (
                found[0].status,
                found[0].amount,
                found[0].proof_file.clone(),
            )
        };
        assert_eq!(burns.len(), 3, "{burns:?}");
        assert_eq!(
            status(COMMITMENT),
            (
                "claimable",
                1_000_000_000,
                Some(format!("{CLAIM_KEY}-{COMMITMENT}.json"))
            )
        );
        assert_eq!(
            status(&claimed),
            ("claimed", 1_000_000_000, Some("done.json".to_string()))
        );
        assert_eq!(status(&pending), ("pending", 5, None));

        let (file, proof) = find_claimable(dir, COMMITMENT).expect("claimable");
        assert_eq!(file, format!("{CLAIM_KEY}-{COMMITMENT}.json"));
        assert_eq!(proof.claim_proof.value, 1_000_000_000);
        assert!(find_claimable(dir, &claimed).is_err());
        assert!(find_claimable(dir, &pending).is_err());
        assert!(
            list_burns(&dir.join("missing"), Vec::new())
                .expect("empty")
                .is_empty()
        );
    }

    #[test]
    fn burns_list_newest_first() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let (old, new) = ("11".repeat(32), "22".repeat(32));
        write(dir, "new.json", &other_proof(&new));
        write(dir, "old.json", &other_proof(&old));
        let an_hour_ago = SystemTime::now() - std::time::Duration::from_secs(3600);
        std::fs::File::options()
            .write(true)
            .open(dir.join("old.json"))
            .and_then(|file| file.set_modified(an_hour_ago))
            .expect("mtime");
        let pending = |c: &str| L2Burn::pending(c.to_string(), CLAIM_KEY.to_string(), 1);

        // The wallet db hands pending burns over oldest first.
        let burns = list_burns(dir, vec![pending("aa"), pending("bb")]).expect("burns");

        let order: Vec<_> = burns.iter().map(|b| b.commitment.as_str()).collect();
        assert_eq!(order, ["bb", "aa", new.as_str(), old.as_str()]);
    }

    #[test]
    fn a_burn_for_another_key_fails_the_ownership_check() {
        let dir = tempfile::tempdir().expect("temp dir");
        let url = url::Url::parse("http://127.0.0.1:1").expect("url");
        let mut sdk =
            super::super::open_sdk(dir.path(), Network::Esmeralda, url, "test").expect("sdk");
        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        let key = sdk.key_manager_api().next_account_address().expect("key");
        let account = sdk
            .accounts_api()
            .create_account(Some("default"), true, key)
            .expect("account");
        let account = sdk
            .accounts_api()
            .get_account_by_address(account.component_address())
            .expect("account");
        let proof: BurnProof = serde_json::from_str(PROOF).expect("proof");

        let Err(e) = claim_keys(&sdk, &account, &proof.claim_proof) else {
            panic!("a burn for someone else's key must not validate");
        };
        assert!(
            e.to_string().contains("ownership proof validation failed"),
            "{e}"
        );
        assert!(
            sdk.accounts_api()
                .get_account_by_public_key(&proof.claim_proof.burn_public_key)
                .optional()
                .expect("lookup")
                .is_none()
        );
    }
}
