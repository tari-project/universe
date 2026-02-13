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

use crate::mining::pools::{
    PoolStatus,
    adapters::{
        kryptex_pool::KryptexPoolAdapter, lucky_pool::LuckyPoolAdapter,
        support_xmr_pool::SupportXmrPoolAdapter,
    },
};

pub mod kryptex_pool;
pub mod lucky_pool;
pub mod support_xmr_pool;

pub(crate) trait PoolApiAdapter: Clone {
    fn name(&self) -> &str;
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error>;
    async fn request_pool_status(&self, address: String) -> Result<PoolStatus, anyhow::Error>;
}

#[derive(Clone, Debug)]
pub enum PoolApiAdapters {
    LuckyPool(LuckyPoolAdapter),
    SupportXmr(SupportXmrPoolAdapter),
    Kryptex(KryptexPoolAdapter),
}

impl PoolApiAdapter for PoolApiAdapters {
    fn name(&self) -> &str {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.name(),
            PoolApiAdapters::SupportXmr(adapter) => adapter.name(),
            PoolApiAdapters::Kryptex(adapter) => adapter.name(),
        }
    }

    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.convert_api_data(data),
            PoolApiAdapters::SupportXmr(adapter) => adapter.convert_api_data(data),
            PoolApiAdapters::Kryptex(adapter) => adapter.convert_api_data(data),
        }
    }
    async fn request_pool_status(&self, address: String) -> Result<PoolStatus, anyhow::Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.request_pool_status(address).await,
            PoolApiAdapters::SupportXmr(adapter) => adapter.request_pool_status(address).await,
            PoolApiAdapters::Kryptex(adapter) => adapter.request_pool_status(address).await,
        }
    }
}
