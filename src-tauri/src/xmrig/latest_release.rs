use log::info;
use serde::Deserialize;

const LOG_TARGET: &str = "tari::universe::xmrig::latest_release";
#[derive(Debug, Deserialize)]
pub struct Asset {
    pub(crate) id: String,
    pub(crate) name: String,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct XmrigRelease {
    pub(crate) version: String,
    pub(crate) assets: Vec<Asset>,
}

impl XmrigRelease {
    pub fn get_asset(&self, id: &str) -> Option<&Asset> {
        for asset in &self.assets {
            info!(target: LOG_TARGET, "Checking asset {:?}", asset);
            if asset.id == id {
                return Some(asset);
            }
        }
        None
    }
}
