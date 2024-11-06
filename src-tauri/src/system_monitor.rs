use core::hash;
use std::{sync::Arc, time::Duration};

use log::debug;
use simple_moving_average::{SumTreeSMA, SMA};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::{select, sync::RwLock, time::interval};

use crate::{cpu_miner::CpuMiner, p2pool_manager::P2poolManager};

const CPU_HASHRATE_LOG_TARGET: &str = "cpu_hashrate";

pub(crate) struct SystemMonitor {
    cpu_miner: Arc<RwLock<CpuMiner>>,
    p2pool_manager: P2poolManager,
}

impl SystemMonitor {
    pub async fn new(cpu_miner: Arc<RwLock<CpuMiner>>, p2pool_manager: P2poolManager) -> Self {
        Self {
            cpu_miner,
            p2pool_manager,
        }
    }

    pub async fn run(&self, mut shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        let mut hash_rate_check_interval = interval(Duration::from_secs(10));
        hash_rate_check_interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

        let mut cpu_average_hashrate = SumTreeSMA::<_, f64, 6>::new();
        loop {
            select! {
                _ = hash_rate_check_interval.tick() => {
                    // Not interested in estimated earnings, so we just pass 0
                    let mut miner = self.cpu_miner.write().await;
                    let status = miner.status(0, MicroMinotari::from(0)).await?;
                    let mut squad = "default_3_mid";
                    if status.is_mining {
                        cpu_average_hashrate.add_sample(status.hash_rate);
                        let average = cpu_average_hashrate.get_average();
                        debug!(target: CPU_HASHRATE_LOG_TARGET, "{},{}", status.hash_rate, cpu_average_hashrate.get_average());
                        if average > 10_000.0 {
                            squad = "default_3_high";
                        } else if average > 1_000.0 {
                            squad = "default_3_mid";
                        } else {
                            squad = "default_3_low";
                        }
                    }
                    else {
                        cpu_average_hashrate = SumTreeSMA::<_, f64, 6>::new();
                    }


                   // let p2pool_squad = self.p2pool_manager.get_squad().await?;
                },
                _ = shutdown.wait() => {
                    break;
                }
            }
        }
        Ok(())
    }
}

pub(crate) struct SystemMonitorClient {}

pub(crate) enum SystemMonitorRequest {}
