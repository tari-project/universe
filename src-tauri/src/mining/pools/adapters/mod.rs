use crate::mining::pools::{
    adapters::{lucky_pool::LuckyPoolAdapter, support_xmr_pool::SupportXmrPoolAdapter},
    PoolStatus,
};

pub mod lucky_pool;
pub mod support_xmr_pool;

pub(crate) trait PoolApiAdapter: Clone {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error>;
}

#[derive(Clone)]
pub enum PoolApiAdapters {
    LuckyPool(LuckyPoolAdapter),
    SupportXmrPool(SupportXmrPoolAdapter),
}

impl Default for PoolApiAdapters {
    fn default() -> Self {
        PoolApiAdapters::LuckyPool(LuckyPoolAdapter {})
    }
}

impl PoolApiAdapter for PoolApiAdapters {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.convert_api_data(data),
            PoolApiAdapters::SupportXmrPool(adapter) => adapter.convert_api_data(data),
        }
    }
}
