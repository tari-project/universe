use serde::Serialize;

mod adapters;
pub mod cpu_pool_manager;
pub mod gpu_pool_manager;
pub mod pools_manager;

#[derive(Clone, Debug, Serialize, Default)]
pub(crate) struct PoolStatus {
    pub accepted_shares: u64,
    pub unpaid: u64,
    pub balance: u64,
    pub min_payout: u64,
}
