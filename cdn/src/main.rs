use std::env;

use anyhow::anyhow;
use regex::Regex;
use reqwest::Client;
use semver::Version;
use serde::Deserialize;

#[repr(u8)]
#[derive(Clone, Debug, PartialEq, Eq, Copy)]
pub enum Network {
    MainNet = 0x00,
    StageNet = 0x01,
    NextNet = 0x02,
    LocalNet = 0x10,
    Igor = 0x24,
    Esmeralda = 0x26,
}

#[derive(Deserialize)]
struct Release {
    name: String,
    tag_name: String,
    draft: bool,
    assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
    name: String,
    browser_download_url: String,
}

#[derive(Debug, Clone)]
pub struct VersionAsset {
    pub(crate) url: String,
    pub(crate) name: String,
}

#[derive(Debug, Clone)]
pub struct VersionDownloadInfo {
    pub(crate) version: Version,
    pub(crate) assets: Vec<VersionAsset>,
}

pub async fn list_cdn_releases(component: &str) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let url = format!(
        "https://tari-universe-v1.s3.eu-north-1.amazonaws.com/{0}/{0}.releases.json",
        component
    );
    println!("Fetching releases from {}", url);
    list_releases(&url).await
}

pub async fn list_github_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases",
        repo_owner, repo_name
    );
    list_releases(&url).await
}

pub async fn list_releases(url: &str) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let client = Client::new();

    let response = client
        .get(url)
        .header("User-Agent", "request")
        .send()
        .await?;
    if response.status() != 200 {
        return Err(anyhow!(
            "Failed to fetch releases from: {} \n {}",
            url,
            response.status()
        ));
    }
    let data = response.text().await?;

    let releases: Vec<Release> = serde_json::from_str(&data)?;

    let mut res = vec![];
    for release in releases {
        if release.draft {
            continue;
        }

        if release.name.contains(".old") {
            continue;
        }
        // Remove any v prefix
        let release_name = release.tag_name.trim_start_matches('v').to_string();
        let mut assets = vec![];
        for asset in release.assets {
            assets.push(VersionAsset {
                url: asset.browser_download_url,
                name: asset.name,
            });
        }
        match semver::Version::parse(&release_name) {
            Ok(v) => {
                res.push(VersionDownloadInfo { version: v, assets });
            }
            Err(e) => {
                continue;
            }
        }
    }

    Ok(res)
}

fn is_version_allowed(version: &Version, version_pre_filter: Option<Regex>) -> bool {
    if let Some(pre_filter) = version_pre_filter {
        return pre_filter.is_match(version.pre.as_str());
    }
    true
}

#[tokio::main]
async fn main() {
    let network = Network::NextNet;
    let tari_pre_filter = match network {
        Network::NextNet => Some(Regex::new(r"rc").unwrap()),
        Network::Esmeralda => Some(Regex::new(r"pre").unwrap()),
        _ => panic!("Unsupported network"),
    };

    let github_output_path = env::var("GITHUB_OUTPUT").unwrap();
    let args: Vec<String> = env::args().collect();

    let github_releases = list_github_releases("xmrig", "xmrig").await.unwrap();
    let s3_releases = list_cdn_releases("xmrig").await.unwrap();

    let latest_github_release = github_releases.iter().map(|v| Some(&v.version)).max();
    println!("Latest Github release: {:?}", latest_github_release);
    let latest_s3_release = s3_releases.iter().map(|v| Some(&v.version)).max();
    println!("Latest S3 release: {:?}", latest_s3_release);
}
