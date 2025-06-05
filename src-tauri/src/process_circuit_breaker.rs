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

use log::{info, warn, error};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

const LOG_TARGET: &str = "tari::universe::circuit_breaker";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CircuitState {
    Closed,     // Normal operation
    Open,       // Failure threshold exceeded, stop retrying
    HalfOpen,   // Testing if service recovered
}

#[derive(Debug, Clone)]
pub struct ProcessCircuitBreaker {
    state: CircuitState,
    failure_count: u32,
    failure_threshold: u32,
    recovery_timeout: Duration,
    #[allow(dead_code)]
    last_failure_time: Option<Instant>,
    success_threshold: u32, // Number of successes needed in HalfOpen to go to Closed
    consecutive_successes: u32,
    process_name: String,
}

impl ProcessCircuitBreaker {
    pub fn new(process_name: String, failure_threshold: u32, recovery_timeout: Duration) -> Self {
        Self {
            state: CircuitState::Closed,
            failure_count: 0,
            failure_threshold,
            recovery_timeout,
            last_failure_time: None,
            success_threshold: 3, // Default: need 3 consecutive successes to close circuit
            consecutive_successes: 0,
            process_name,
        }
    }

    pub fn should_attempt_retry(&mut self) -> bool {
        match self.state {
            CircuitState::Closed => {
                info!(target: LOG_TARGET, "Circuit closed for {}, allowing retry", self.process_name);
                true
            }
            CircuitState::Open => {
                if let Some(last_failure) = self.last_failure_time {
                    if last_failure.elapsed() > self.recovery_timeout {
                        info!(target: LOG_TARGET, "Recovery timeout elapsed for {}, transitioning to half-open", self.process_name);
                        self.state = CircuitState::HalfOpen;
                        self.consecutive_successes = 0;
                        true
                    } else {
                        let remaining = self.recovery_timeout.saturating_sub(last_failure.elapsed());
                        warn!(target: LOG_TARGET, "Circuit open for {}, blocking retry for {:?} more", 
                              self.process_name, remaining);
                        false
                    }
                } else {
                    // No last failure time, should not happen in Open state
                    warn!(target: LOG_TARGET, "Circuit open for {} but no last failure time, allowing retry", self.process_name);
                    true
                }
            }
            CircuitState::HalfOpen => {
                info!(target: LOG_TARGET, "Circuit half-open for {}, allowing test retry", self.process_name);
                true
            }
        }
    }
    
    pub fn record_success(&mut self) {
        match self.state {
            CircuitState::Closed => {
                // Reset failure count on success
                if self.failure_count > 0 {
                    info!(target: LOG_TARGET, "Success recorded for {} in closed state, resetting failure count", self.process_name);
                    self.failure_count = 0;
                }
            }
            CircuitState::HalfOpen => {
                self.consecutive_successes += 1;
                info!(target: LOG_TARGET, "Success recorded for {} in half-open state ({}/{})", 
                      self.process_name, self.consecutive_successes, self.success_threshold);
                
                if self.consecutive_successes >= self.success_threshold {
                    info!(target: LOG_TARGET, "Circuit closing for {} after {} consecutive successes", 
                          self.process_name, self.consecutive_successes);
                    self.state = CircuitState::Closed;
                    self.failure_count = 0;
                    self.consecutive_successes = 0;
                    self.last_failure_time = None;
                }
            }
            CircuitState::Open => {
                // Should not record success in Open state
                warn!(target: LOG_TARGET, "Success recorded for {} in open state, this should not happen", self.process_name);
            }
        }
    }
    
    pub fn record_failure(&mut self) {
        self.failure_count += 1;
        self.last_failure_time = Some(Instant::now());
        self.consecutive_successes = 0; // Reset on any failure
        
        match self.state {
            CircuitState::Closed => {
                if self.failure_count >= self.failure_threshold {
                    error!(target: LOG_TARGET, "Circuit opening for {} after {} failures (threshold: {})", 
                           self.process_name, self.failure_count, self.failure_threshold);
                    self.state = CircuitState::Open;
                } else {
                    warn!(target: LOG_TARGET, "Failure recorded for {} in closed state ({}/{})", 
                          self.process_name, self.failure_count, self.failure_threshold);
                }
            }
            CircuitState::HalfOpen => {
                error!(target: LOG_TARGET, "Circuit opening for {} after failure in half-open state", self.process_name);
                self.state = CircuitState::Open;
            }
            CircuitState::Open => {
                warn!(target: LOG_TARGET, "Additional failure recorded for {} in open state", self.process_name);
            }
        }
    }

    pub fn get_state(&self) -> &CircuitState {
        &self.state
    }

    pub fn get_failure_count(&self) -> u32 {
        self.failure_count
    }

    pub fn get_time_until_recovery(&self) -> Option<Duration> {
        if self.state == CircuitState::Open {
            if let Some(last_failure) = self.last_failure_time {
                let elapsed = last_failure.elapsed();
                if elapsed < self.recovery_timeout {
                    return Some(self.recovery_timeout - elapsed);
                }
            }
        }
        None
    }

    pub fn reset(&mut self) {
        info!(target: LOG_TARGET, "Circuit breaker reset for {}", self.process_name);
        self.state = CircuitState::Closed;
        self.failure_count = 0;
        self.consecutive_successes = 0;
        self.last_failure_time = None;
    }

    pub fn force_open(&mut self) {
        warn!(target: LOG_TARGET, "Circuit breaker forced open for {}", self.process_name);
        self.state = CircuitState::Open;
        self.last_failure_time = Some(Instant::now());
    }

    pub fn configure_thresholds(&mut self, failure_threshold: u32, success_threshold: u32) {
        self.failure_threshold = failure_threshold;
        self.success_threshold = success_threshold;
        info!(target: LOG_TARGET, "Circuit breaker thresholds updated for {}: failure={}, success={}", 
              self.process_name, failure_threshold, success_threshold);
    }
}

impl Default for ProcessCircuitBreaker {
    fn default() -> Self {
        Self::new(
            "unknown".to_string(),
            5, // Default failure threshold
            Duration::from_secs(60), // Default recovery timeout: 1 minute
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_circuit_breaker_closed_to_open() {
        let mut cb = ProcessCircuitBreaker::new("test".to_string(), 3, Duration::from_secs(60));
        
        // Should start closed
        assert_eq!(cb.get_state(), &CircuitState::Closed);
        assert!(cb.should_attempt_retry());
        
        // Record failures
        cb.record_failure();
        assert_eq!(cb.get_state(), &CircuitState::Closed);
        assert!(cb.should_attempt_retry());
        
        cb.record_failure();
        assert_eq!(cb.get_state(), &CircuitState::Closed);
        assert!(cb.should_attempt_retry());
        
        cb.record_failure();
        assert_eq!(cb.get_state(), &CircuitState::Open);
        assert!(!cb.should_attempt_retry());
    }

    #[test]
    fn test_circuit_breaker_open_to_half_open() {
        let mut cb = ProcessCircuitBreaker::new("test".to_string(), 2, Duration::from_millis(100));
        
        // Force to open state
        cb.record_failure();
        cb.record_failure();
        assert_eq!(cb.get_state(), &CircuitState::Open);
        assert!(!cb.should_attempt_retry());
        
        // Wait for recovery timeout
        thread::sleep(Duration::from_millis(150));
        
        // Should transition to half-open
        assert!(cb.should_attempt_retry());
        assert_eq!(cb.get_state(), &CircuitState::HalfOpen);
    }

    #[test]
    fn test_circuit_breaker_half_open_to_closed() {
        let mut cb = ProcessCircuitBreaker::new("test".to_string(), 2, Duration::from_secs(60));
        
        // Manually set to half-open
        cb.state = CircuitState::HalfOpen;
        
        // Record successes
        cb.record_success();
        assert_eq!(cb.get_state(), &CircuitState::HalfOpen);
        
        cb.record_success();
        assert_eq!(cb.get_state(), &CircuitState::HalfOpen);
        
        cb.record_success();
        assert_eq!(cb.get_state(), &CircuitState::Closed);
    }

    #[test]
    fn test_circuit_breaker_half_open_to_open_on_failure() {
        let mut cb = ProcessCircuitBreaker::new("test".to_string(), 2, Duration::from_secs(60));
        
        // Manually set to half-open
        cb.state = CircuitState::HalfOpen;
        
        // Record a failure
        cb.record_failure();
        assert_eq!(cb.get_state(), &CircuitState::Open);
    }
}
