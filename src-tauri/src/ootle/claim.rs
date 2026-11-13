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

use std::{
    collections::{HashMap, HashSet},
    iter,
    path::Path,
    sync::{Mutex, PoisonError},
    time::SystemTime,
};

use anyhow::{anyhow, bail};
use log::warn;
use serde::Serialize;
use tari_crypto::{
    keys::PublicKey as _,
    ristretto::{RistrettoPublicKey, RistrettoSecretKey},
    tari_utilities::ByteArray,
};
use tari_engine_types::{
    commit_result::{ExecutionFailureCode, RejectReason},
    confidential::MinotariBurnClaimProof,
    fees::FEE_ESTIMATE_ALLOWANCE,
    stealth::{ClaimBurnShape, declared_input_bytes, persisted_utxo_bytes},
    substate::SubstateId,
};
use tari_ootle_app_utilities::{
    burn_claim_proof::claim_proof_from_l1, fee_tables::fee_rates_by_network,
};
use tari_ootle_common_types::{Epoch, NumPreshards, optional::Optional};
use tari_ootle_transaction::{Instruction, Transaction, TransactionId};
use tari_ootle_wallet_sdk::{
    apis::substate::SubstateApiError,
    crypto::{OutputWitness, StealthInputWitness, StealthOutputWitness, memo::Memo},
    models::{
        AccountWithAddress, KeyBranch, TransactionContext, TransactionContextKind,
        TransactionStatus, WalletEvent, WalletSecretKey,
    },
    network::WalletNetworkInterface,
};
use tari_ootle_wallet_sdk_services::transaction_service::TransactionServiceHandle;
use tari_sidechain::CompleteClaimBurnProof;
use tari_template_lib::{
    prelude::RistrettoPublicKeyBytes,
    types::{
        Amount, ClaimedOutputTombstoneAddress,
        constants::{STEALTH_TARI_RESOURCE_ADDRESS, TARI_TOKEN},
        stealth::{RevealedOutput, SpendAuthorization},
    },
};

use super::{
    LOG_TARGET, OotleSdk,
    send::{MAX_L2_FEE, VALIDITY_EPOCHS, check_fee, submit, with_indexer_timeout},
};
use crate::wallet::minotari_wallet::MinotariWalletManager;

/// Claimed proof files move here, the same place tari_walletd puts them.
const CLAIMED_DIR: &str = "claimed";
/// Submitted claims and sends waiting to finalize, transaction id to proof file (`null`
/// for a send), kept next to the proofs so a restart doesn't lose track of them.
const PENDING_CLAIMS_FILE: &str = "pending_claims.json";
/// The submit path and the event listener both change the pending claims file.
static PENDING_CLAIMS_LOCK: Mutex<()> = Mutex::new(());
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
    /// "claimed" once a claim is accepted on L2. "foreign" instead of "claimable" when
    /// the claim key isn't one of this wallet's L2 accounts. "abandoned" instead of
    /// "pending" once the user abandoned it: it may still be mined, and then turns claimable.
    pub status: &'static str,
    /// The L1 height the burn was mined at, once its proof is written. The L2 can't
    /// accept its claim until it has imported that block.
    pub mined_height: Option<u64>,
    /// Unix seconds, when the burn was made (its proof file's mtime when the L1 wallet
    /// has no record of it).
    pub timestamp: u64,
}

/// How a submitted claim or send ended on L2.
#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct L2ClaimResult {
    /// "claim" or "send".
    pub kind: &'static str,
    /// Hex, the claimed burn's commitment. `None` for a send.
    pub commitment: Option<String>,
    pub accepted: bool,
    /// Why the claim was rejected, when the L2 said.
    pub reason: Option<String>,
    /// Rejected only because the L2 hasn't seen the burn yet.
    pub not_yet_claimable: bool,
}

impl L2ClaimResult {
    /// The result for a claim of the proof `file` ({claim key}-{commitment}.json), or for
    /// a send when there's no file.
    fn new(file: Option<&str>, accepted: bool, reason: Option<String>, not_yet: bool) -> Self {
        let commitment = file.map(|file| {
            file.strip_suffix(".json")
                .and_then(|name| name.rsplit_once('-'))
                .map_or(file, |(_, commitment)| commitment)
                .to_string()
        });
        Self {
            kind: if file.is_some() { "claim" } else { "send" },
            not_yet_claimable: file.is_some() && not_yet,
            commitment,
            accepted,
            reason,
        }
    }
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
            mined_height: None,
            timestamp: 0,
        }
    }
}

/// A proof file the L1 burn proof worker writes, converted into the claim the L2 takes.
pub struct BurnProof {
    pub claim_proof: MinotariBurnClaimProof,
    /// The L2 account key `P` the burn was made out to.
    pub account_key: RistrettoPublicKeyBytes,
    /// The L1 height the burn was mined at.
    pub mined_height: u64,
    /// The L1 epoch the burn was mined in. The L2 takes the claim once it's past it.
    mined_in_epoch: u64,
}

impl BurnProof {
    fn from_json(json: &[u8]) -> Result<Self, anyhow::Error> {
        let file: CompleteClaimBurnProof = serde_json::from_slice(json)?;
        Ok(Self {
            claim_proof: claim_proof_from_l1(&file.claim_proof)
                .map_err(|e| anyhow!("Invalid burn proof: {e}"))?,
            account_key: RistrettoPublicKeyBytes::try_from(
                file.claim_proof.burn_public_key.as_bytes(),
            )?,
            mined_height: file.claim_proof.output_proof.block_height,
            mined_in_epoch: file.mined_in_epoch,
        })
    }
}

/// Every burn the panel knows about, newest first: proof files in `dir` are claimable,
/// those in its claimed directory are claimed, and `pending` rows without a proof file
/// yet stay pending. `times` from the L1 wallet db say when each burn was made.
pub fn list_burns(
    dir: &Path,
    pending: Vec<L2Burn>,
    times: &HashMap<String, u64>,
) -> Result<Vec<L2Burn>, anyhow::Error> {
    let mut files = read_burns(dir, "claimable")?;
    files.extend(read_burns(&dir.join(CLAIMED_DIR), "claimed")?);
    let known: HashSet<String> = files.iter().map(|b| b.commitment.clone()).collect();
    let mut burns: Vec<L2Burn> = pending
        .into_iter()
        .filter(|b| !known.contains(&b.commitment))
        .chain(files)
        .collect();
    for burn in &mut burns {
        if let Some(&time) = times.get(&burn.commitment) {
            burn.timestamp = time;
        }
    }
    burns.sort_by_key(|b| std::cmp::Reverse(b.timestamp));
    Ok(burns)
}

/// Fills in each burn's last claim rejection from `errors`, keyed by proof file.
/// Marks claimable burns whose claim key is neither one of this wallet's L2 accounts nor its
/// default claim key "foreign", since claim_burn would refuse them.
pub fn mark_foreign(sdk: &OotleSdk, burns: &mut [L2Burn]) -> Result<(), anyhow::Error> {
    // The default claim key is this wallet's even before its account exists, which is
    // the case for every pre-burn: recovery can't create the account until launch.
    let default_key = hex::encode(
        sdk.key_manager_api()
            .derive_account_key_pair(0)?
            .public_key
            .as_bytes(),
    );
    for burn in burns
        .iter_mut()
        .filter(|b| b.status == "claimable" && b.claim_public_key != default_key)
    {
        let key =
            RistrettoPublicKeyBytes::try_from(hex::decode(&burn.claim_public_key)?.as_slice())?;
        if sdk
            .accounts_api()
            .get_account_by_public_key(&key)
            .optional()?
            .is_none()
        {
            burn.status = "foreign";
        }
    }
    Ok(())
}

/// True if a claim was rejected because the burn's L1 block isn't synced into a
/// claimable epoch yet, rather than because the claim is bad.
fn is_burn_not_yet_claimable(reject: &RejectReason) -> bool {
    reject.execution_failure_code() == Some(ExecutionFailureCode::NotYetValid)
}

/// The claimable proof for `commitment` and its file name.
pub fn find_claimable(dir: &Path, commitment: &str) -> Result<(String, BurnProof), anyhow::Error> {
    let file = read_burns(dir, "claimable")?
        .into_iter()
        .find(|burn| burn.commitment == commitment)
        .and_then(|burn| burn.proof_file)
        .ok_or_else(|| anyhow!("No claimable burn with commitment {commitment}"))?;
    ensure_no_pending_claim(dir, &file)?;
    let proof = read_proof(&dir.join(&file))?;
    Ok((file, proof))
}

/// Refuses `file` while a claim of it is still waiting to finalize: its proof only moves
/// once the network accepts, so a second claim would be submitted and rejected on-chain.
fn ensure_no_pending_claim(dir: &Path, file: &str) -> Result<(), anyhow::Error> {
    if load_claims(dir)
        .values()
        .any(|f| f.as_deref() == Some(file))
    {
        bail!("This burn already has a claim waiting for the network.");
    }
    Ok(())
}

/// The burns with a proof file in `dir`, timed by when the file was last modified.
fn read_burns(dir: &Path, status: &'static str) -> Result<Vec<L2Burn>, anyhow::Error> {
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
        if !path.is_file() || !file.ends_with(".json") || file == PENDING_CLAIMS_FILE {
            continue;
        }
        match read_proof(&path) {
            Ok(proof) => burns.push(L2Burn {
                commitment: hex::encode(proof.claim_proof.commitment.as_bytes()),
                claim_public_key: hex::encode(proof.account_key.as_bytes()),
                amount: proof.claim_proof.value,
                proof_file: Some(file.to_string()),
                status,
                mined_height: Some(proof.mined_height),
                timestamp: std::fs::metadata(&path)?
                    .modified()?
                    .duration_since(SystemTime::UNIX_EPOCH)?
                    .as_secs(),
            }),
            Err(e) => warn!(target: LOG_TARGET, "Skipping an unreadable burn proof: {e}"),
        }
    }
    Ok(burns)
}

pub fn read_proof(path: &Path) -> Result<BurnProof, anyhow::Error> {
    if std::fs::metadata(path)?.len() > MAX_PROOF_BYTES {
        bail!("The burn proof file is too large");
    }
    BurnProof::from_json(&std::fs::read(path)?)
}

/// Copy a completed claim proof to a location chosen by the user, keeping the app's original.
pub fn save_proof_copy(
    dir: &Path,
    proof_file: &str,
    destination: &Path,
) -> Result<(), anyhow::Error> {
    let source = proof_path(dir, proof_file)?;
    read_proof(&source).map_err(|e| anyhow!("Burn proof is not ready or is invalid: {e}"))?;
    let source = std::fs::canonicalize(source)?;
    let parent = std::fs::canonicalize(
        destination
            .parent()
            .ok_or_else(|| anyhow!("Invalid backup location"))?,
    )?;
    if parent.starts_with(std::fs::canonicalize(dir)?) {
        bail!("Choose a location outside the app's burn proof folder");
    }
    if destination.exists() && std::fs::canonicalize(destination)? == source {
        bail!("Choose a different location for the backup");
    }
    std::fs::copy(source, destination)?;
    Ok(())
}

fn proof_path(dir: &Path, proof_file: &str) -> Result<std::path::PathBuf, anyhow::Error> {
    let name = Path::new(proof_file)
        .file_name()
        .ok_or_else(|| anyhow!("Invalid burn proof file name"))?;
    Ok(dir.join(name))
}

/// Submitted claims and sends, transaction id to the claim's proof file or `None` for
/// a send.
type Tracked = HashMap<TransactionId, Option<String>>;

/// The submitted claims and sends saved in `dir`.
fn load_claims(dir: &Path) -> Tracked {
    let read = match std::fs::read(dir.join(PENDING_CLAIMS_FILE)) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return HashMap::new(),
        read => read,
    };
    read.map_err(anyhow::Error::from)
        .and_then(|json| Ok(serde_json::from_slice(&json)?))
        .unwrap_or_else(|e| {
            warn!(target: LOG_TARGET, "Could not read the pending claims: {e}");
            HashMap::new()
        })
}

/// Written to a sibling file and renamed over, so a crash mid-write can't leave half a
/// file, which would load as no pending claims at all.
fn save_claims(dir: &Path, claims: &Tracked) {
    let path = dir.join(PENDING_CLAIMS_FILE);
    let tmp = path.with_extension("json.tmp");
    let saved = serde_json::to_vec(claims)
        .map_err(std::io::Error::from)
        .and_then(|json| {
            std::fs::create_dir_all(dir)?;
            std::fs::write(&tmp, json)?;
            std::fs::rename(&tmp, &path)
        });
    if let Err(e) = saved {
        warn!(target: LOG_TARGET, "Could not save the pending claims: {e}");
    }
}

/// Loads what's tracked in `dir`, lets `change` edit it and saves it if it changed.
fn update_tracked<R>(dir: &Path, change: impl FnOnce(&mut Tracked) -> R) -> R {
    let _lock = PENDING_CLAIMS_LOCK
        .lock()
        .unwrap_or_else(PoisonError::into_inner);
    let mut tracked = load_claims(dir);
    let before = tracked.clone();
    let result = change(&mut tracked);
    if tracked != before {
        save_claims(dir, &tracked);
    }
    result
}

/// Remembers a transaction about to be submitted, a claim of `claim_file` or a send when
/// that's `None`, so its outcome is reported whenever it settles.
pub fn track(dir: &Path, id: TransactionId, claim_file: Option<String>) {
    update_tracked(dir, |tracked| tracked.insert(id, claim_file));
}

/// Forgets a transaction that was never submitted.
pub fn untrack(dir: &Path, id: TransactionId) {
    update_tracked(dir, |tracked| tracked.remove(&id));
}

fn mark_claimed(dir: &Path, file: &str) {
    let moved = std::fs::create_dir_all(dir.join(CLAIMED_DIR))
        .and_then(|()| std::fs::rename(dir.join(file), dir.join(CLAIMED_DIR).join(file)));
    if let Err(e) = moved {
        warn!(target: LOG_TARGET, "Could not mark a burn proof claimed: {e}");
    }
}

/// Settles a tracked transaction once it's finalized or invalid: an accepted claim's
/// proof file moves into the claimed directory, a rejected claim's stays claimable.
fn settle(
    dir: &Path,
    file: Option<String>,
    accepted: bool,
    reason: Option<String>,
    not_yet: bool,
) -> L2ClaimResult {
    match (&file, accepted) {
        (Some(file), true) => mark_claimed(dir, file),
        (Some(_), false) => {
            warn!(target: LOG_TARGET, "An L2 claim was rejected, its burn stays claimable: {reason:?}")
        }
        (None, true) => {}
        (None, false) => warn!(target: LOG_TARGET, "An L2 send was rejected: {reason:?}"),
    }
    L2ClaimResult::new(file.as_deref(), accepted, reason, not_yet)
}

/// True only when the transaction's main (and fee) intent succeeded (`TransactionStatus::Accepted`).
/// `TransactionStatus::OnlyFeeAccepted` means the fee was paid on-chain while the main instructions
/// were rejected (`AcceptFeeRejectRest`), so a send or claim with that status was not accepted.
fn is_settled_accepted(status: TransactionStatus) -> bool {
    status == TransactionStatus::Accepted
}

/// Settles tracked claims and sends that finished while nothing was listening (Universe
/// was closed or events were missed) and returns how they ended. `status` looks a
/// transaction up in the wallet, `None` when the wallet doesn't have it. Accepted and
/// rejected ones settle, unknown ones are dropped (their burn is claimable again),
/// pending ones stay.
pub fn reconcile_claims(
    dir: &Path,
    status: impl Fn(TransactionId) -> Result<Option<TransactionStatus>, anyhow::Error>,
) -> Vec<L2ClaimResult> {
    update_tracked(dir, |tracked| {
        let mut ended = Vec::new();
        tracked.retain(|id, file| match status(*id) {
            Ok(Some(TransactionStatus::New | TransactionStatus::Pending)) => true,
            Ok(Some(status)) => {
                ended.push((file.take(), is_settled_accepted(status)));
                false
            }
            Ok(None) => {
                if file
                    .as_deref()
                    .is_some_and(|f| !dir.join(f).exists() && dir.join(CLAIMED_DIR).join(f).is_file())
                {
                    ended.push((file.take(), true));
                } else {
                    warn!(target: LOG_TARGET, "The wallet has no record of {id}, no longer tracking it");
                }
                false
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not look up {id}: {e}");
                true
            }
        });
        ended
            .into_iter()
            .map(|(file, accepted)| settle(dir, file, accepted, None, false))
            .collect()
    })
}

/// How a tracked claim or send ended, once it finalizes or turns out invalid. `None` for
/// any other event or a transaction that isn't tracked.
pub fn track_claim(dir: &Path, event: &WalletEvent) -> Option<L2ClaimResult> {
    let (id, status, reject, invalid) = match event {
        WalletEvent::TransactionFinalized(event) => (
            event.transaction_id,
            event.status,
            event.finalize.result.any_reject(),
            false,
        ),
        WalletEvent::TransactionInvalid(event) => (
            event.transaction_id,
            event.status,
            event.finalize.as_ref().and_then(|f| f.result.any_reject()),
            true,
        ),
        _ => return None,
    };
    let accepted = !invalid && is_settled_accepted(status) && reject.is_none();
    let reason = match reject {
        Some(reject) => Some(reject.to_string()),
        None if invalid => Some("The transaction is invalid".to_string()),
        None if !accepted => Some(format!("Transaction ended with status {status}")),
        None => None,
    };
    let not_yet = reject.is_some_and(is_burn_not_yet_claimable);
    let file = update_tracked(dir, |tracked| tracked.remove(&id))?;
    Some(settle(dir, file, accepted, reason, not_yet))
}

/// The wallet SDK verifies this read against a trusted validator committee.
/// A missing or unverified tombstone must leave the proof claimable.
async fn verified_claim_tombstone_exists(
    sdk: &OotleSdk,
    proof: &BurnProof,
) -> Result<bool, anyhow::Error> {
    let tombstone = SubstateId::ClaimedOutputTombstone(
        ClaimedOutputTombstoneAddress::from_commitment(proof.claim_proof.commitment),
    );
    match with_indexer_timeout(
        sdk.substate_api()
            .fetch_substate_from_network(&tombstone, None),
    )
    .await?
    {
        Ok(_) => Ok(true),
        Err(SubstateApiError::SubstateDoesNotExist { .. }) => Ok(false),
        Err(error) => Err(error.into()),
    }
}

/// Claims the burn in `proof` into the wallet account its claim key belongs to and
/// returns the L2 transaction id. Dry runs at a fee of 1 first, like tari_walletd's
/// auto claim, and submits at the fee the dry run asks for once `approve_fee` accepts it.
/// Refuses a fee over [`MAX_L2_FEE`] or half the burn.
pub async fn claim_burn(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    proof: BurnProof,
    file_name: String,
    approve_fee: impl AsyncFnOnce(u64) -> Result<(), anyhow::Error>,
) -> Result<TransactionId, anyhow::Error> {
    // Checked again here, under the send gate permit: a second click passes
    // find_claimable before the first claim is tracked.
    let proof_dir = MinotariWalletManager::burn_proofs_dir()?;
    ensure_no_pending_claim(&proof_dir, &file_name)?;
    let claim_key = proof.account_key;
    let account = sdk
        .accounts_api()
        .get_account_by_public_key(&claim_key)
        .optional()?
        .ok_or_else(|| {
            anyhow!("The claim key {claim_key} isn't one of this wallet's L2 accounts")
        })?;
    if verified_claim_tombstone_exists(sdk, &proof).await? {
        mark_claimed(&proof_dir, &file_name);
        bail!("This burn has already been claimed on Layer 2.");
    }
    let epoch = with_indexer_timeout(sdk.get_network_interface().get_current_epoch()).await??;
    // The dry run doesn't check L1 inclusion, so it can't catch a claim made too early.
    ensure_claimable_in(epoch, proof.mined_in_epoch)?;
    let max_epoch = Epoch(epoch.as_u64().saturating_add(VALIDITY_EPOCHS));
    let build = |fee, dry_run| {
        let claim = Claim {
            account: &account,
            proof: &proof.claim_proof,
            max_fee: fee,
            max_epoch,
            dry_run,
        };
        build_claim(sdk, claim)
    };

    // The fee-1 dry run doubles as the probe the claim is priced from: weight, output and
    // inputs follow the claim's shape, not its fee.
    let probe = build(1, true)?;
    let price = with_indexer_timeout(claim_price(sdk, &probe)).await??;
    let result = with_indexer_timeout(transactions.submit_dry_run_transaction(probe))
        .await?
        .map_err(|e| anyhow!("The claim fee estimate failed: {e}"))?;
    if let Some(reason) = result.finalize.any_reject() {
        if verified_claim_tombstone_exists(sdk, &proof).await? {
            mark_claimed(&proof_dir, &file_name);
            bail!("This burn has already been claimed on Layer 2: {reason}");
        }
        bail!("The claim would be rejected: {reason}");
    }
    let fee = check_claim_fee(
        result.finalize.required_fees(),
        price,
        proof.claim_proof.value,
    )?;
    approve_fee(fee).await?;
    let transaction = build(fee, false)?;
    let context = TransactionContext::with_accounts([*account.component_address()]).with_kind(
        TransactionContextKind::ClaimBurn {
            file_name: file_name.clone(),
        },
    );
    // A claim that's rejected outright stays claimable.
    submit(
        sdk,
        transactions,
        transaction,
        context,
        None,
        Some(file_name),
    )
    .await
}

/// Refuses a claim until the L2 is past the epoch the burn was mined in, which is when
/// its validators have the burn's L1 block. Before that the network rejects the claim.
fn ensure_claimable_in(epoch: Epoch, mined_in_epoch: u64) -> Result<(), anyhow::Error> {
    if epoch.as_u64() <= mined_in_epoch {
        bail!(
            "The L2 hasn't seen this burn yet. It's at epoch {} and can take the claim from epoch {}.",
            epoch.as_u64(),
            mined_in_epoch.saturating_add(1)
        );
    }
    Ok(())
}

/// The fee the indexer's dry run asks for, but no more than the claim's local `price`: a fee
/// paid from the claimed bucket isn't refunded. It comes out of the burn itself, so on top of
/// the flat ceiling it may take at most half of it. A refused claim keeps its proof and can be
/// claimed later.
fn check_claim_fee(required: u64, price: u64, burn_value: u64) -> Result<u64, anyhow::Error> {
    check_fee(required.min(price), MAX_L2_FEE.min(burn_value / 2))
}

/// An upper bound on what the engine charges for `probe`, a claim built at any fee, priced
/// locally as walletd prices its claims. Only the TARI resource's size is read from the network,
/// and the SDK verifies that read.
async fn claim_price(sdk: &OotleSdk, probe: &Transaction) -> Result<u64, anyhow::Error> {
    let statement = probe
        .fee_instructions()
        .iter()
        .find_map(|instruction| match instruction {
            Instruction::StealthTransfer { statement, .. } => Some(statement),
            _ => None,
        })
        .ok_or_else(|| anyhow!("The claim has no stealth transfer to price"))?;
    let tari = SubstateId::from(TARI_TOKEN);
    // A read that straddles an epoch change fails until the indexer proves it against the new
    // validator set. Retry those, as walletd does; the caller's indexer timeout bounds the loop.
    let substates = loop {
        match sdk
            .substate_api()
            .get_substates_from_network(std::slice::from_ref(&tari))
            .await
        {
            Err(
                SubstateApiError::SubstateUnproven { .. }
                | SubstateApiError::SubstateProvenPastServedCheckpoints { .. }
                | SubstateApiError::SubstateProvenBeforeAnchor { .. },
            ) => tokio::time::sleep(std::time::Duration::from_secs(1)).await,
            result => break result?,
        }
    };
    let tari_bytes = substates
        .get(&tari)
        // The SDK verifies what the indexer returns, not what it leaves out, and pricing a
        // missing input at zero would underfund the claim.
        .map(|substate| declared_input_bytes(substate.substate_value()))
        .ok_or_else(|| anyhow!("The indexer didn't return the TARI resource to price the claim"))?;
    let input_bytes = if probe
        .all_inputs_iter()
        .any(|input| *input.substate_id() == tari)
    {
        tari_bytes
    } else {
        0
    };
    let num_preshards = NumPreshards::current();
    let shape = ClaimBurnShape {
        persisted_output_bytes: statement
            .outputs_statement
            .outputs
            .iter()
            .map(persisted_utxo_bytes)
            .sum(),
        transaction_weight: probe.calculate_transaction_weight().as_u64(),
        input_bytes,
        // ponytail: one committee per preshard, walletd's upper bound for an unknown layout. Fetch
        // the checkpoint layout like walletd if the looser cap ever matters.
        input_fanout: probe.input_fanout(num_preshards, num_preshards.as_u32()),
    };
    Ok(shape
        .estimate_fee(&fee_rates_by_network(sdk.network()))
        .saturating_add(FEE_ESTIMATE_ALLOWANCE))
}

struct Claim<'a> {
    account: &'a AccountWithAddress,
    proof: &'a MinotariBurnClaimProof,
    max_fee: u64,
    max_epoch: Epoch,
    dry_run: bool,
}

/// Builds and signs the claim: reveal the burned value in a bucket, then pay the bucket
/// into a stealth output for the account, revealing `max_fee` to pay the fee.
fn build_claim(sdk: &OotleSdk, claim: Claim<'_>) -> Result<Transaction, anyhow::Error> {
    let network = sdk.network();
    let crypto = sdk.stealth_crypto_api();
    let keys = sdk.key_manager_api();
    let (owner, stealth_secret) = claim_keys(sdk, claim.account, claim.proof)?;
    // claim_keys checked the ownership proof, which binds this value to the burn commitment.
    let amount = claim
        .proof
        .value
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
    let owner_key = crypto.derive_stealth_owner_public_key(
        network,
        &owner.to_public_key(),
        view_only.public_key(),
        &nonce,
    );
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
    // The claim key signs, so it is the only badge in scope to take the revealed fee.
    let statement = crypto.generate_transfer_statement(
        iter::empty::<StealthInputWitness>(),
        Amount::from(claim.proof.value),
        iter::once(&output),
        Some(RevealedOutput::new(
            Amount::from(claim.max_fee),
            claim.proof.output.features.claim_public_key,
        )),
    )?;
    let transaction = Transaction::builder(network.as_byte(), claim.max_epoch)
        .with_fee_instructions_builder(|builder| {
            builder
                .claim_burn(claim.proof.clone())
                .put_last_instruction_output_on_workspace("claimed")
                .stealth_transfer_with_input_bucket(TARI_TOKEN, statement, "claimed")
                .put_last_instruction_output_on_workspace("fee")
                .pay_fee_from_bucket("fee")
        })
        .with_dry_run(claim.dry_run)
        .finish();
    Ok(sdk
        .signer_api()
        .sign_with_explicit_key(&stealth_secret, transaction)?)
}

/// The account's owner key and the stealth claim secret `s = H(p·R) + p`, where `R` is
/// the burn's sender offset key. Fails unless the burn output names `s·G` as its claim key and
/// its ownership proof was made for it, which are the checks the network makes too.
fn claim_keys(
    sdk: &OotleSdk,
    account: &AccountWithAddress,
    proof: &MinotariBurnClaimProof,
) -> Result<(WalletSecretKey, RistrettoSecretKey), anyhow::Error> {
    let key_id = account
        .owner_key_id()
        .ok_or_else(|| anyhow!("This L2 account has no owner key to claim with"))?;
    let owner = sdk.key_manager_api().get_key(key_id)?;
    let sender_offset =
        RistrettoPublicKey::from_canonical_bytes(proof.output.sender_offset_public_key.as_bytes())
            .map_err(|e| anyhow!("The burn proof has a bad sender offset key: {e}"))?;
    let crypto = sdk.stealth_crypto_api();
    let stealth_secret = crypto.derive_burn_claim_stealth_secret(owner.secret(), &sender_offset);
    let stealth_key = RistrettoPublicKeyBytes::try_from(
        RistrettoPublicKey::from_secret_key(&stealth_secret).as_bytes(),
    )?;
    if stealth_key != proof.output.features.claim_public_key {
        bail!(
            "claim key mismatch: the burn is made out to claim key {}, not this account's {stealth_key}",
            proof.output.features.claim_public_key
        );
    }
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
    Ok((owner, stealth_secret))
}

#[cfg(test)]
mod tests {
    use tari_common::configuration::Network;
    use tari_ootle_wallet_sdk::cipher_seed::CipherSeedRestore;

    use super::*;

    /// A burn proof in the format the burn proof worker writes (1000 XTM, mined at 12345),
    /// for an account key and claim key of no wallet made here. Its inclusion and
    /// ownership proofs are placeholders.
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
        json["claim_proof"]["output_proof"]["output"]["commitment"] = commitment.into();
        json.to_string()
    }

    #[test]
    fn claim_fees_are_capped_by_the_ceiling_and_half_the_burn() {
        assert_eq!(
            check_claim_fee(5_000, u64::MAX, 1_000_000_000).unwrap(),
            5_000
        );
        assert!(check_claim_fee(MAX_L2_FEE + 1, u64::MAX, 1_000_000_000).is_err());
        assert_eq!(check_claim_fee(5_000, u64::MAX, 10_000).unwrap(), 5_000);
        assert!(check_claim_fee(5_001, u64::MAX, 10_000).is_err());
        assert!(check_claim_fee(1, u64::MAX, 1).is_err());
    }

    /// The fee comes from the indexer's dry run. A claim reveals no more than its own price, so an
    /// indexer that overprices it can't burn the difference.
    #[test]
    fn a_claim_reveals_no_more_than_its_local_price() {
        assert_eq!(
            check_claim_fee(90_000, 3_000, 1_000_000_000).unwrap(),
            3_000
        );
        assert_eq!(check_claim_fee(2_000, 3_000, 1_000_000_000).unwrap(), 2_000);
    }

    #[test]
    fn rejections_map_to_the_result() {
        let failure = |code| RejectReason::ExecutionFailure {
            code,
            message: "At instruction #1: irrelevant to the decision".to_string(),
        };
        assert!(is_burn_not_yet_claimable(&failure(
            ExecutionFailureCode::NotYetValid
        )));
        assert!(!is_burn_not_yet_claimable(&failure(
            ExecutionFailureCode::InsufficientFunds
        )));

        let file = format!("{CLAIM_KEY}-{COMMITMENT}.json");
        let result = |accepted, not_yet| {
            let r = L2ClaimResult::new(Some(&file), accepted, None, not_yet);
            (
                r.kind,
                r.commitment.unwrap_or_default(),
                r.accepted,
                r.not_yet_claimable,
            )
        };
        let commitment = COMMITMENT.to_string();
        assert_eq!(
            result(true, false),
            ("claim", commitment.clone(), true, false)
        );
        assert_eq!(
            result(false, true),
            ("claim", commitment.clone(), false, true)
        );
        assert!(
            !L2ClaimResult::new(None, false, None, true).not_yet_claimable,
            "a send is never a burn claim"
        );
    }

    #[test]
    fn claims_wait_until_the_l2_is_past_the_burns_epoch() {
        assert!(ensure_claimable_in(Epoch(3), 3).is_err());
        assert!(ensure_claimable_in(Epoch(2), 3).is_err());
        assert!(ensure_claimable_in(Epoch(4), 3).is_ok());
    }

    #[test]
    fn reads_the_burn_proof_workers_file() {
        let proof = BurnProof::from_json(PROOF.as_bytes()).expect("proof");
        assert_eq!(
            hex::encode(proof.claim_proof.commitment.as_bytes()),
            COMMITMENT
        );
        assert_eq!(hex::encode(proof.account_key.as_bytes()), CLAIM_KEY);
        assert_eq!(proof.claim_proof.value, 1_000_000_000);
        assert_eq!(proof.mined_height, 12_345);
    }

    #[test]
    fn reads_a_proof_in_the_shape_minotari_writes() {
        // minotari's BurnProofWorker writes the published tari_sidechain type with
        // serde_json::to_vec_pretty. The claim code reads it with ootle's own type.
        let written: tari_sidechain_l1::CompleteClaimBurnProof =
            serde_json::from_str(PROOF).expect("the published format");
        let json = serde_json::to_vec_pretty(&written).expect("json");
        assert_eq!(
            String::from_utf8(json.clone()).expect("utf8").trim_end(),
            PROOF.trim_end(),
            "the fixture is exactly what the worker writes"
        );

        let proof = BurnProof::from_json(&json).expect("converted by claim_proof_from_l1");
        assert_eq!(
            hex::encode(proof.claim_proof.commitment.as_bytes()),
            COMMITMENT
        );
        assert_eq!(hex::encode(proof.account_key.as_bytes()), CLAIM_KEY);
        assert_eq!(proof.claim_proof.value, 1_000_000_000);
        assert_eq!(proof.mined_height, 12_345);
        assert_eq!(proof.mined_in_epoch, written.mined_in_epoch);
    }

    #[test]
    fn proof_backup_copies_only_a_completed_proof_and_keeps_the_original() {
        let dir = tempfile::tempdir().expect("dir");
        let backup_dir = tempfile::tempdir().expect("backup dir");
        let proof_file = format!("{CLAIM_KEY}-{COMMITMENT}.json");
        let destination = backup_dir.path().join("backup.json");
        assert!(save_proof_copy(dir.path(), &proof_file, &destination).is_err());
        write(dir.path(), &proof_file, PROOF);
        save_proof_copy(dir.path(), &proof_file, &destination).expect("copy");
        assert_eq!(std::fs::read_to_string(destination).expect("backup"), PROOF);
        assert_eq!(
            std::fs::read_to_string(dir.path().join(&proof_file)).expect("original"),
            PROOF
        );
        assert!(save_proof_copy(dir.path(), &proof_file, &dir.path().join(&proof_file)).is_err());
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
            &HashMap::new(),
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
            list_burns(&dir.join("missing"), Vec::new(), &HashMap::new())
                .expect("empty")
                .is_empty()
        );
    }

    #[test]
    fn a_burn_with_a_claim_pending_cannot_be_claimed_again() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let file = format!("{CLAIM_KEY}-{COMMITMENT}.json");
        write(dir, &file, PROOF);
        let id = TransactionId::from([1; 32]);
        track(dir, id, Some(file));

        let Err(err) = find_claimable(dir, COMMITMENT) else {
            panic!("a burn with a claim pending must not be claimable");
        };
        assert_eq!(
            err.to_string(),
            "This burn already has a claim waiting for the network."
        );
        untrack(dir, id);
        assert!(find_claimable(dir, COMMITMENT).is_ok());
    }

    #[test]
    fn burns_list_newest_first_by_when_they_were_made() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let (old, new, unknown) = ("11".repeat(32), "22".repeat(32), "33".repeat(32));
        // The old burn's proof landed last, but the wallet db says it was made first.
        write(dir, "old.json", &other_proof(&old));
        write(dir, "new.json", &other_proof(&new));
        write(dir, "unknown.json", &other_proof(&unknown));
        let an_hour_ago = SystemTime::now() - std::time::Duration::from_secs(3600);
        std::fs::File::options()
            .write(true)
            .open(dir.join("unknown.json"))
            .and_then(|file| file.set_modified(an_hour_ago))
            .expect("mtime");
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("now")
            .as_secs();
        let times = HashMap::from([
            (old.clone(), now - 7200),
            (new.clone(), now - 1800),
            ("aa".to_string(), now - 60),
            ("bb".to_string(), now - 5400),
        ]);
        let pending = |c: &str| L2Burn::pending(c.to_string(), CLAIM_KEY.to_string(), 1);

        let burns = list_burns(dir, vec![pending("aa"), pending("bb")], &times).expect("burns");

        let order: Vec<_> = burns.iter().map(|b| b.commitment.as_str()).collect();
        assert_eq!(
            order,
            ["aa", new.as_str(), unknown.as_str(), "bb", old.as_str()]
        );
    }

    #[test]
    fn saved_claims_reload_and_settle_against_the_wallet() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let id = |n: u8| TransactionId::from([n; 32]);
        let file = |n: u8| format!("{n}.json");
        for n in 1..=5 {
            write(dir, &file(n), PROOF);
        }
        assert!(load_claims(dir).is_empty());
        for n in 1..=5 {
            track(dir, id(n), Some(file(n)));
        }
        // Sends 16 and 17, accepted and rejected.
        track(dir, id(16), None);
        track(dir, id(17), None);
        track(dir, id(9), None);
        untrack(dir, id(9));

        let claims = load_claims(dir);
        assert_eq!(claims.len(), 7);
        assert_eq!(claims.get(&id(3)), Some(&Some(file(3))));
        assert_eq!(claims.get(&id(16)), Some(&None));
        let settled = reconcile_claims(dir, |tx| match tx.as_bytes()[0] {
            1 | 16 => Ok(Some(TransactionStatus::Accepted)),
            2 | 17 => Ok(Some(TransactionStatus::Rejected)),
            3 => Ok(Some(TransactionStatus::Pending)),
            4 => Ok(None),
            _ => Err(anyhow!("store busy")),
        });

        let mut settled: Vec<_> = settled
            .into_iter()
            .map(|r| (r.kind, r.commitment, r.accepted))
            .collect();
        settled.sort();
        assert_eq!(
            settled,
            [
                ("claim", Some(file(1)), true),
                ("claim", Some(file(2)), false),
                ("send", None, false),
                ("send", None, true),
            ]
        );
        let mut still_tracked: Vec<u8> =
            load_claims(dir).keys().map(|tx| tx.as_bytes()[0]).collect();
        still_tracked.sort();
        assert_eq!(still_tracked, [3, 5]);
        assert!(dir.join(CLAIMED_DIR).join(file(1)).is_file());
        assert!(!dir.join(file(1)).exists());
        for n in 2..=5 {
            assert!(dir.join(file(n)).is_file(), "{n} stays claimable");
        }

        write(dir, PENDING_CLAIMS_FILE, "not json");
        assert!(load_claims(dir).is_empty());
    }

    #[test]
    fn pending_claims_are_written_whole() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let files = || -> Vec<String> {
            let mut names: Vec<_> = std::fs::read_dir(dir)
                .expect("dir")
                .map(|e| e.expect("entry").file_name().to_string_lossy().into_owned())
                .collect();
            names.sort();
            names
        };
        let inode = || {
            #[cfg(unix)]
            {
                use std::os::unix::fs::MetadataExt;
                std::fs::metadata(dir.join(PENDING_CLAIMS_FILE))
                    .map(|m| m.ino())
                    .ok()
            }
            #[cfg(not(unix))]
            None::<u64>
        };
        let id = |n: u8| TransactionId::from([n; 32]);
        track(dir, id(1), Some("a.json".to_string()));
        let first = inode();
        track(dir, id(2), None);

        assert_eq!(files(), [PENDING_CLAIMS_FILE]);
        // Each save is a fresh file renamed into place, never an in-place rewrite.
        assert_ne!(first, inode());
        let claims = load_claims(dir);
        assert_eq!(claims.get(&id(1)), Some(&Some("a.json".to_string())));
        assert_eq!(claims.get(&id(2)), Some(&None));
    }

    #[test]
    fn a_rejected_send_reports_once_and_needs_no_proof_dir() {
        let dir = tempfile::tempdir().expect("temp dir");
        // A wallet that never burned has no proof dir yet.
        let dir = dir.path().join("burn_proofs");
        let id = TransactionId::from([7; 32]);
        track(&dir, id, None);
        let invalid = WalletEvent::TransactionInvalid(
            tari_ootle_wallet_sdk::models::TransactionInvalidEvent {
                transaction_id: id,
                status: TransactionStatus::InvalidTransaction,
                finalize: None,
                final_fee: None,
            },
        );

        let result = track_claim(&dir, &invalid).expect("tracked send");
        assert_eq!((result.kind, result.accepted), ("send", false));
        assert!(result.reason.is_some());
        assert!(track_claim(&dir, &invalid).is_none(), "reported once");
    }

    #[test]
    fn a_burn_for_another_key_is_foreign_and_fails_the_ownership_check() {
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
        let proof = BurnProof::from_json(PROOF.as_bytes()).expect("proof");
        let claimable = |key: String| L2Burn {
            status: "claimable",
            ..L2Burn::pending(String::new(), key, 1)
        };
        let own_key = hex::encode(account.owner_public_key().as_slice());
        let mut burns = [claimable(own_key), claimable(CLAIM_KEY.to_string())];
        mark_foreign(&sdk, &mut burns).expect("mark foreign");
        assert_eq!(burns.map(|b| b.status), ["claimable", "foreign"]);

        let Err(e) = claim_keys(&sdk, &account, &proof.claim_proof) else {
            panic!("a burn for someone else's key must not validate");
        };
        assert!(e.to_string().contains("claim key mismatch"), "{e}");
        assert!(
            sdk.accounts_api()
                .get_account_by_public_key(&proof.account_key)
                .optional()
                .expect("lookup")
                .is_none()
        );
    }

    #[test]
    fn a_pre_burn_to_the_default_claim_key_is_not_foreign_without_an_account() {
        let dir = tempfile::tempdir().expect("temp dir");
        let url = url::Url::parse("http://127.0.0.1:1").expect("url");
        let mut sdk =
            super::super::open_sdk(dir.path(), Network::Esmeralda, url, "test").expect("sdk");
        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        let default_key = hex::encode(
            sdk.key_manager_api()
                .derive_account_key_pair(0)
                .expect("key")
                .public_key
                .as_bytes(),
        );
        let claimable = |key: String| L2Burn {
            status: "claimable",
            ..L2Burn::pending(String::new(), key, 1)
        };
        let mut burns = [claimable(default_key), claimable(CLAIM_KEY.to_string())];
        mark_foreign(&sdk, &mut burns).expect("mark foreign");
        assert_eq!(burns.map(|b| b.status), ["claimable", "foreign"]);
    }

    #[test]
    fn unverified_duplicate_rejection_keeps_burn_proof_claimable() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let file = format!("{CLAIM_KEY}-{COMMITMENT}.json");
        write(dir, &file, PROOF);

        let duplicate = RejectReason::ExecutionFailure {
            code: ExecutionFailureCode::EngineInvariant,
            message: format!("At instruction #0: Duplicate substate tombstone_{COMMITMENT}"),
        };
        let id = TransactionId::from([9; 32]);
        track(dir, id, Some(file.clone()));
        let finalized = WalletEvent::TransactionFinalized(
            tari_ootle_wallet_sdk::models::TransactionFinalizedEvent {
                transaction_id: id,
                finalize: tari_engine_types::commit_result::FinalizeResult::new_rejected(
                    Default::default(),
                    duplicate,
                ),
                final_fee: 0,
                status: TransactionStatus::Rejected,
            },
        );
        let res = track_claim(dir, &finalized).expect("settled claim");
        assert!(!res.accepted);
        assert!(dir.join(&file).is_file());
        assert!(!dir.join(CLAIMED_DIR).join(&file).exists());
    }

    #[test]
    fn only_fee_accepted_keeps_burn_proof_claimable_and_reports_rejected() {
        let dir = tempfile::tempdir().expect("temp dir");
        let dir = dir.path();
        let file = format!("{CLAIM_KEY}-{COMMITMENT}.json");
        write(dir, &file, PROOF);

        let id = TransactionId::from([10; 32]);
        track(dir, id, Some(file.clone()));
        let finalized = WalletEvent::TransactionFinalized(
            tari_ootle_wallet_sdk::models::TransactionFinalizedEvent {
                transaction_id: id,
                finalize: tari_engine_types::commit_result::FinalizeResult::new(
                    Default::default(),
                    vec![],
                    vec![],
                    tari_engine_types::commit_result::TransactionResult::Accept(Default::default()),
                    Default::default(),
                ),
                final_fee: 100,
                status: TransactionStatus::OnlyFeeAccepted,
            },
        );
        let res = track_claim(dir, &finalized).expect("settled claim");
        assert!(!res.accepted);
        assert!(res.reason.is_some());
        assert!(dir.join(&file).is_file());
        assert!(!dir.join(CLAIMED_DIR).join(&file).exists());
    }
}
