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

use std::time::Duration;

use tokio::{
    sync::{RwLock, RwLockReadGuard, RwLockWriteGuard},
    time::sleep,
};

const LOCK_RETRY_DELAY: Duration = Duration::from_millis(500);

pub async fn try_read_with_retry<T>(
    lock: &RwLock<T>,
    retries: u32,
) -> Result<RwLockReadGuard<T>, String> {
    for i in 0..retries {
        match lock.try_read() {
            Ok(guard) => return Ok(guard),
            Err(_) => {
                if i == retries - 1 {
                    return Err(format!(
                        "Failed to acquire read lock after {} retries",
                        retries
                    ));
                }
                sleep(LOCK_RETRY_DELAY).await;
            }
        }
    }
    Err("Failed to acquire read lock".to_string())
}

pub async fn try_write_with_retry<T>(
    lock: &RwLock<T>,
    retries: u32,
) -> Result<RwLockWriteGuard<T>, String> {
    for i in 0..retries {
        match lock.try_write() {
            Ok(guard) => return Ok(guard),
            Err(_) => {
                if i == retries - 1 {
                    return Err(format!(
                        "Failed to acquire write lock after {} retries",
                        retries
                    ));
                }
                sleep(LOCK_RETRY_DELAY).await;
            }
        }
    }
    Err("Failed to acquire write lock".to_string())
}
