use crate::mining::pools::{
    adapters::{lucky_pool::LuckyPoolAdapter, support_xmr_pool::SupportXmrPoolAdapter},
    PoolStatus,
};

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
    SupportXmrPool(SupportXmrPoolAdapter),
}

impl PoolApiAdapter for PoolApiAdapters {
    fn name(&self) -> &str {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.name(),
            PoolApiAdapters::SupportXmrPool(adapter) => adapter.name(),
        }
    }

    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.convert_api_data(data),
            PoolApiAdapters::SupportXmrPool(adapter) => adapter.convert_api_data(data),
        }
    }
    async fn request_pool_status(&self, address: String) -> Result<PoolStatus, anyhow::Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.request_pool_status(address).await,
            PoolApiAdapters::SupportXmrPool(adapter) => adapter.request_pool_status(address).await,
        }
    }
}
