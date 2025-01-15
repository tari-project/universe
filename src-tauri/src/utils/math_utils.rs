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

use log::warn;
use tari_core::transactions::tari_amount::MicroMinotari;

const BLOCKS_PER_DAY: u64 = 360; // both RandomX and SHA3 produce 360 blocks per day - 720 in total
const LOG_TARGET: &str = "tari::universe::math_utils";

pub fn estimate_earning(
    network_hash_rate: u64,
    hash_rate: f64,
    block_reward: MicroMinotari,
) -> u64 {
    let estimated_earnings = if network_hash_rate == 0 {
        warn!(
            target: LOG_TARGET,
            "Network hash rate is zero. Cannot estimate earnings"
        );
        0
    } else {
        #[allow(clippy::cast_possible_truncation)]
        {
            ((block_reward.as_u64() as f64)
                * ((hash_rate / (network_hash_rate as f64)) * (BLOCKS_PER_DAY as f64)))
                .floor() as u64
        }
    };

    // Can't be more than the max reward for a day
    let estimated_earnings =
        std::cmp::min(estimated_earnings, block_reward.as_u64() * BLOCKS_PER_DAY);
    return estimated_earnings;
}
