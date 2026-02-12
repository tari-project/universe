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

use std::collections::{HashMap, VecDeque};
use std::time::Instant;

use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;

// TODO: Remove allow(dead_code) when Phase 2 (MCP server) uses rate limiting
#[allow(dead_code)]
#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub enum RateLimitTier {
    Read,
    Control,
    Transaction,
}

// TODO: Remove allow(dead_code) when Phase 2 (MCP server) uses rate limiting
#[allow(dead_code)]
pub struct RateLimiter {
    windows: HashMap<(RateLimitTier, String), VecDeque<Instant>>,
}

#[allow(dead_code)]
impl RateLimiter {
    pub fn new() -> Self {
        Self {
            windows: HashMap::new(),
        }
    }

    pub async fn check_allowed(&mut self, tier: &RateLimitTier, client_key: &str) -> bool {
        let config = ConfigMcp::content().await;
        let limit = match tier {
            RateLimitTier::Read | RateLimitTier::Control => *config.rate_limit_read(),
            RateLimitTier::Transaction => *config.rate_limit_transaction(),
        };

        let now = Instant::now();
        let window = std::time::Duration::from_secs(60);
        let key = (tier.clone(), client_key.to_string());

        let timestamps = self.windows.entry(key).or_default();

        // Remove expired entries
        while timestamps
            .front()
            .is_some_and(|t| now.duration_since(*t) > window)
        {
            timestamps.pop_front();
        }

        if timestamps.len() >= limit as usize {
            return false;
        }

        timestamps.push_back(now);
        true
    }
}
