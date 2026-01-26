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

use super::errors::BalanceCalculationError;

pub struct BalanceCalculator;

impl BalanceCalculator {
    pub fn calculate_new_balance(
        current_balance: u64,
        incoming_balance: u64,
        outgoing_balance: u64,
    ) -> Result<u64, BalanceCalculationError> {
        let current = current_balance;

        let new_balance =
            current
                .checked_add(incoming_balance)
                .ok_or(BalanceCalculationError::Overflow {
                    current: current_balance,
                    credit: incoming_balance,
                })?;

        let new_balance = new_balance.checked_sub(outgoing_balance).ok_or(
            BalanceCalculationError::Underflow {
                current: current_balance,
                debit: outgoing_balance,
            },
        )?;
        Ok(new_balance)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_new_balance_happy_path() {
        // Simple addition and subtraction
        let result = BalanceCalculator::calculate_new_balance(100, 50, 30);
        assert_eq!(result.expect("Simple addition and subtraction"), 120);

        // Zero incoming
        let result = BalanceCalculator::calculate_new_balance(100, 0, 30);
        assert_eq!(result.expect("Zero incoming"), 70);

        // Zero outgoing
        let result = BalanceCalculator::calculate_new_balance(100, 50, 0);
        assert_eq!(result.expect("Zero outgoing"), 150);

        // Both zero
        let result = BalanceCalculator::calculate_new_balance(100, 0, 0);
        assert_eq!(result.expect("Both zero"), 100);

        // Zero balance with incoming
        let result = BalanceCalculator::calculate_new_balance(0, 100, 50);
        assert_eq!(result.expect("Zero balance with incoming"), 50);

        // Large values
        let result = BalanceCalculator::calculate_new_balance(1_000_000, 500_000, 300_000);
        assert_eq!(result.expect("Large values"), 1_200_000);
    }

    #[test]
    fn test_calculate_new_balance_overflow() {
        // Adding to u64::MAX causes overflow
        let result = BalanceCalculator::calculate_new_balance(u64::MAX, 1, 0);
        assert!(result.is_err());
        match result.expect_err("Adding to u64::MAX causes overflow") {
            BalanceCalculationError::Overflow { current, credit } => {
                assert_eq!(current, u64::MAX);
                assert_eq!(credit, 1);
            }
            _ => panic!("Expected Overflow error"),
        }

        // Large incoming causing overflow
        let result = BalanceCalculator::calculate_new_balance(u64::MAX - 10, 20, 0);
        assert!(result.is_err());
        match result.expect_err("Large incoming causing overflow") {
            BalanceCalculationError::Overflow { current, credit } => {
                assert_eq!(current, u64::MAX - 10);
                assert_eq!(credit, 20);
            }
            _ => panic!("Expected Overflow error"),
        }

        // Overflow even though outgoing would bring it back down
        let result = BalanceCalculator::calculate_new_balance(u64::MAX, 100, 100);
        assert!(result.is_err());
        match result.expect_err("Overflow even though outgoing would bring it back down") {
            BalanceCalculationError::Overflow { .. } => {}
            _ => panic!("Expected Overflow error"),
        }
    }

    #[test]
    fn test_calculate_new_balance_underflow() {
        // Subtracting more than available
        let result = BalanceCalculator::calculate_new_balance(100, 0, 101);
        assert!(result.is_err());
        match result.expect_err("Subtracting more than available") {
            BalanceCalculationError::Underflow { current, debit } => {
                assert_eq!(current, 100);
                assert_eq!(debit, 101);
            }
            _ => panic!("Expected Underflow error"),
        }

        // Zero balance with outgoing
        let result = BalanceCalculator::calculate_new_balance(0, 0, 1);
        assert!(result.is_err());
        match result.expect_err("Zero balance with outgoing") {
            BalanceCalculationError::Underflow { current, debit } => {
                assert_eq!(current, 0);
                assert_eq!(debit, 1);
            }
            _ => panic!("Expected Underflow error"),
        }

        // Incoming + current < outgoing
        let result = BalanceCalculator::calculate_new_balance(100, 50, 200);
        assert!(result.is_err());
        match result.expect_err("Incoming + current < outgoing") {
            BalanceCalculationError::Underflow { current, debit } => {
                assert_eq!(current, 100);
                assert_eq!(debit, 200);
            }
            _ => panic!("Expected Underflow error"),
        }

        // Large outgoing value
        let result = BalanceCalculator::calculate_new_balance(1000, 500, u64::MAX);
        assert!(result.is_err());
        match result.expect_err("Large outgoing value") {
            BalanceCalculationError::Underflow { .. } => {}
            _ => panic!("Expected Underflow error"),
        }
    }

    #[test]
    fn test_calculate_new_balance_edge_cases() {
        // Max balance minus max outgoing = 0
        let result = BalanceCalculator::calculate_new_balance(u64::MAX, 0, u64::MAX);
        assert_eq!(result.expect("Max balance minus max outgoing = 0"), 0);

        // Zero balance with equal incoming and outgoing
        let result = BalanceCalculator::calculate_new_balance(0, 100, 100);
        assert_eq!(
            result.expect("Zero balance with equal incoming and outgoing"),
            0
        );

        // All max values should underflow (overflow first, actually)
        let result = BalanceCalculator::calculate_new_balance(u64::MAX, u64::MAX, u64::MAX);
        assert!(result.is_err());
    }
}
