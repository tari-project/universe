use crate::p2pool::models::Stats;
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
}
