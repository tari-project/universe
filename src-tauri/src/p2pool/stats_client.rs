use crate::p2pool::models::Stats;
use anyhow::Error;

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
        let stats = reqwest::get(self.stats_server_address.as_str())
            .await?
            .json::<Stats>()
            .await?;
        Ok(stats)
    }
}
