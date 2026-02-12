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

use std::collections::VecDeque;
use std::time::Instant;

use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;

// TODO: Remove allow(dead_code) when Phase 2 (MCP server) uses the transaction rate limiter
#[allow(dead_code)]
pub struct TransactionRateLimiter {
    timestamps: VecDeque<Instant>,
}

#[allow(dead_code)]
impl TransactionRateLimiter {
    pub fn new() -> Self {
        Self {
            timestamps: VecDeque::new(),
        }
    }

    /// Check if a transaction is allowed under the sliding window rate limit.
    /// Returns `true` if the transaction is within the configured limit per minute.
    pub async fn check_transaction_allowed(&mut self) -> bool {
        let config = ConfigMcp::content().await;
        let limit = *config.rate_limit_transaction();

        let now = Instant::now();
        let window = std::time::Duration::from_secs(60);

        // Remove expired entries
        while self
            .timestamps
            .front()
            .is_some_and(|t| now.duration_since(*t) > window)
        {
            self.timestamps.pop_front();
        }

        if self.timestamps.len() >= limit as usize {
            return false;
        }

        self.timestamps.push_back(now);
        true
    }
}
