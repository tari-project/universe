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

use crate::p2pool::models::{Connections, Stats};
use anyhow::Error;
use log::warn;

const LOG_TARGET: &str = "tari::universe::p2pool_stats_client";
#[derive(Clone)]
pub struct Client {
    stats_server_address: String,
}

impl Client {
    pub fn new(stats_server_address: String) -> Self {
        Self {
            stats_server_address,
        }
    }

    pub async fn stats(&self) -> Result<Stats, Error> {
        let stats = reqwest::get(format!("{}/stats", self.stats_server_address))
            .await?
            .json::<Stats>()
            .await
            .inspect_err(|e| warn!(target: LOG_TARGET, "P2pool stats error: {:?}", e))?;
        Ok(stats)
    }

    pub async fn connections(&self) -> Result<Connections, Error> {
        let stats = reqwest::get(format!("{}/connections", self.stats_server_address))
            .await?
            .json::<Connections>()
            .await
            .inspect_err(|e| warn!(target: LOG_TARGET, "P2pool connections error: {:?}", e))?;
        Ok(stats)
    }
}
