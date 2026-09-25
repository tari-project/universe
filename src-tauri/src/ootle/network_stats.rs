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

//! Polls the indexer for the current epoch and network activity, for the tiles at the
//! top of the L2 panel, and sends the L2NetworkStats event whenever the numbers change.
//! The same tick checks for new burns to L2, which no wallet event reports.

use std::time::Duration;

use log::warn;
use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;
use tari_transaction_components::consensus::{ConsensusConstants, ConsensusManager};
use url::Url;

use crate::events_emitter::EventsEmitter;

use super::{LOG_TARGET, OotleSdk, emit_state_on_new_burns};

const POLL_INTERVAL: Duration = Duration::from_secs(30);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct L2NetworkStats {
    pub epoch: u64,
    pub block_height: u64,
    /// L1 blocks per epoch.
    pub epoch_length: u64,
    pub blocks_into_epoch: u64,
    /// The L1 target time between blocks, all mining algorithms together.
    pub block_target_secs: f64,
    pub tx_count: u64,
    /// Micro XTR.
    pub fee_volume: u64,
    /// Micro XTR.
    pub burned: u64,
}

#[derive(Deserialize)]
struct EpochStats {
    current_epoch: u64,
    current_block_height: u64,
}

/// Amounts come back as strings of micro XTR.
#[derive(Deserialize)]
struct Economics {
    transaction_receipt_count: u64,
    fee_volume: String,
    total_exhaust_burned: String,
}

/// Runs straight away and then every 30 seconds, until the wallet stops.
pub async fn poll(sdk: OotleSdk, indexer: Url, network: Network) -> Result<(), anyhow::Error> {
    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()?;
    let consensus = ConsensusManager::builder(network).build();
    let mut last_stats = None;
    let mut last_burns = None;
    let mut interval = tokio::time::interval(POLL_INTERVAL);
    loop {
        interval.tick().await;
        match fetch_stats(&client, &indexer, &consensus).await {
            Ok(stats) if last_stats.as_ref() != Some(&stats) => {
                last_stats = Some(stats.clone());
                EventsEmitter::emit_l2_network_stats(stats).await;
            }
            Ok(_) => {}
            Err(e) => warn!(target: LOG_TARGET, "Could not fetch L2 network stats: {e}"),
        }
        emit_state_on_new_burns(&sdk, &mut last_burns).await;
    }
}

async fn fetch_stats(
    client: &reqwest::Client,
    indexer: &Url,
    consensus: &ConsensusManager,
) -> Result<L2NetworkStats, anyhow::Error> {
    let (epoch, economics) = fetch(client, indexer).await?;
    build_stats(
        &epoch,
        &economics,
        consensus.consensus_constants(epoch.current_block_height),
    )
}

async fn fetch(
    client: &reqwest::Client,
    indexer: &Url,
) -> Result<(EpochStats, Economics), anyhow::Error> {
    let epoch = client
        .get(indexer.join("epoch-manager/stats")?)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let economics = client
        .get(indexer.join("network/economics")?)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok((epoch, economics))
}

fn build_stats(
    epoch: &EpochStats,
    economics: &Economics,
    constants: &ConsensusConstants,
) -> Result<L2NetworkStats, anyhow::Error> {
    let epoch_length = constants.epoch_length();
    Ok(L2NetworkStats {
        epoch: epoch.current_epoch,
        block_height: epoch.current_block_height,
        epoch_length,
        blocks_into_epoch: blocks_into_epoch(
            epoch.current_block_height,
            epoch.current_epoch,
            epoch_length,
        ),
        block_target_secs: block_target_secs(constants),
        tx_count: economics.transaction_receipt_count,
        fee_volume: economics.fee_volume.parse()?,
        burned: economics.total_exhaust_burned.parse()?,
    })
}

/// How far the chain is into `epoch`. The indexer's epoch can lag or lead its block
/// height by a little, so this stays between 0 and the epoch length.
fn blocks_into_epoch(block_height: u64, epoch: u64, epoch_length: u64) -> u64 {
    block_height
        .saturating_sub(epoch.saturating_mul(epoch_length))
        .min(epoch_length)
}

/// Each mining algorithm targets its own block time, so the chain's block time is what
/// they add up to together: one over the sum of their block rates.
fn block_target_secs(constants: &ConsensusConstants) -> f64 {
    let rate: f64 = constants
        .current_permitted_pow_algos()
        .into_iter()
        .map(|algo| constants.pow_target_block_interval(algo))
        .filter(|secs| *secs > 0)
        .map(|secs| 1.0 / secs as f64)
        .sum();
    if rate > 0.0 { 1.0 / rate } else { 0.0 }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn epoch_progress_stays_inside_the_epoch() {
        assert_eq!(blocks_into_epoch(914_567, 11_432, 80), 7);
        assert_eq!(blocks_into_epoch(914_560, 11_432, 80), 0);
        // Epoch ahead of the height.
        assert_eq!(blocks_into_epoch(914_550, 11_432, 80), 0);
        // Epoch behind the height.
        assert_eq!(blocks_into_epoch(914_700, 11_432, 80), 80);
    }

    #[test]
    fn esmeralda_stats_use_the_l1_consensus_constants() {
        let consensus = ConsensusManager::builder(Network::Esmeralda).build();
        let epoch = EpochStats {
            current_epoch: 11_432,
            current_block_height: 914_567,
        };
        let economics = Economics {
            transaction_receipt_count: 130_170,
            fee_volume: "869387135".to_string(),
            total_exhaust_burned: "44720774".to_string(),
        };
        let stats =
            build_stats(&epoch, &economics, consensus.consensus_constants(914_567)).expect("stats");
        assert_eq!(stats.epoch_length, 80);
        assert_eq!(stats.blocks_into_epoch, 7);
        assert!((stats.block_target_secs - 15.0).abs() < f64::EPSILON);
        assert_eq!(stats.fee_volume, 869_387_135);
        assert_eq!(stats.burned, 44_720_774);
    }
}
