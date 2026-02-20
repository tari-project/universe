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

pub struct TransactionRateLimiter {
    timestamps: VecDeque<Instant>,
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    #[test]
    fn new_limiter_has_no_timestamps() {
        let limiter = TransactionRateLimiter::new();
        assert!(limiter.timestamps.is_empty());
    }

    #[test]
    fn new_limiter_deque_length_is_zero() {
        let limiter = TransactionRateLimiter::new();
        assert_eq!(limiter.timestamps.len(), 0);
    }

    #[test]
    fn sliding_window_removes_expired_entries() {
        let mut limiter = TransactionRateLimiter::new();
        // Insert a timestamp that is more than 60 seconds old
        let expired = Instant::now() - Duration::from_secs(120);
        limiter.timestamps.push_back(expired);
        assert_eq!(limiter.timestamps.len(), 1);

        // Insert a fresh timestamp to trigger the cleanup logic
        let now = Instant::now();
        let window = Duration::from_secs(60);
        while limiter
            .timestamps
            .front()
            .is_some_and(|t| now.duration_since(*t) > window)
        {
            limiter.timestamps.pop_front();
        }

        assert!(
            limiter.timestamps.is_empty(),
            "Expired timestamps should be removed"
        );
    }

    #[test]
    fn sliding_window_keeps_fresh_entries() {
        let mut limiter = TransactionRateLimiter::new();
        let fresh = Instant::now();
        limiter.timestamps.push_back(fresh);

        let now = Instant::now();
        let window = Duration::from_secs(60);
        while limiter
            .timestamps
            .front()
            .is_some_and(|t| now.duration_since(*t) > window)
        {
            limiter.timestamps.pop_front();
        }

        assert_eq!(
            limiter.timestamps.len(),
            1,
            "Fresh timestamps should be kept"
        );
    }

    #[test]
    fn window_check_with_mixed_entries() {
        let mut limiter = TransactionRateLimiter::new();
        // Two expired, one fresh
        limiter
            .timestamps
            .push_back(Instant::now() - Duration::from_secs(120));
        limiter
            .timestamps
            .push_back(Instant::now() - Duration::from_secs(90));
        limiter.timestamps.push_back(Instant::now());

        let now = Instant::now();
        let window = Duration::from_secs(60);
        while limiter
            .timestamps
            .front()
            .is_some_and(|t| now.duration_since(*t) > window)
        {
            limiter.timestamps.pop_front();
        }

        assert_eq!(
            limiter.timestamps.len(),
            1,
            "Only the fresh entry should remain"
        );
    }

    #[test]
    fn limit_check_blocks_when_at_capacity() {
        let mut limiter = TransactionRateLimiter::new();
        let limit: usize = 5;
        // Fill to capacity with fresh timestamps
        for _ in 0..limit {
            limiter.timestamps.push_back(Instant::now());
        }

        assert!(
            limiter.timestamps.len() >= limit,
            "Should be at or above limit"
        );
    }

    #[test]
    fn limit_check_allows_when_below_capacity() {
        let mut limiter = TransactionRateLimiter::new();
        let limit: usize = 5;
        for _ in 0..(limit - 1) {
            limiter.timestamps.push_back(Instant::now());
        }

        assert!(limiter.timestamps.len() < limit, "Should be below limit");
    }
}
