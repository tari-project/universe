use log::info;
use serde::Deserialize;

const LOG_TARGET: &str = "tari::universe::xmrig::latest_release";
#[derive(Debug, Deserialize)]
pub struct Asset {
    os: Option<String>,
    id: String,
    pub(crate) name: String,
    pub url: String,
    size: u64,
    ts: u64,
    hash: String,
}

#[derive(Debug, Deserialize)]
pub struct XmrigRelease {
    pub(crate) url: String,
    pub(crate) version: String,
    ts: u64,
    assets: Vec<Asset>,
}

impl XmrigRelease {
    pub fn get_asset(&self, os: &str) -> Option<&Asset> {
        for asset in &self.assets {
            info!(target: LOG_TARGET, "Checking asset {:?}", asset);
            // macos-arm64 doesn't have an os field for some reason
            if asset.os.is_none() {
                if asset.id == os {
                    return Some(asset);
                }
            }
            if asset.os.as_deref() == Some(os) {
                return Some(asset);
            }
        }
        return None;
    }
}

pub async fn fetch_latest_release() -> Result<XmrigRelease, anyhow::Error> {
    let url = "https://api.xmrig.com/1/latest_release";
    let response = reqwest::get(url).await?;
    let latest_release: XmrigRelease = response.json().await?;
    Ok(latest_release)
}
