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
use minotari_wallet::models::BalanceChange;

pub struct BalanceCalculator;

impl BalanceCalculator {
    pub fn calculate_new_balance(
        current_balance: i64,
        balance_change: &BalanceChange,
    ) -> Result<i64, BalanceCalculationError> {
        let current = current_balance as u64;

        let new_balance = current
            .checked_add(balance_change.balance_credit)
            .ok_or_else(|| BalanceCalculationError::Overflow {
                current: current_balance,
                credit: balance_change.balance_credit,
            })?;

        let new_balance = new_balance
            .checked_sub(balance_change.balance_debit)
            .ok_or_else(|| BalanceCalculationError::Underflow {
                current: current_balance,
                debit: balance_change.balance_debit,
            })?;

        #[allow(clippy::cast_possible_wrap)]
        Ok(new_balance as i64)
    }
}
