use std::env;

use anyhow::anyhow;
use reqwest::Client;
use semver::Version;
use serde::Deserialize;

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
    println!("Response: {:?}", response);
    if response.status() != 200 {
        return Err(anyhow!(
            "Failed to fetch releases from: {} \n {}",
            url,
            response.status()
        ));
    }
    let data = response.text().await?;
    println!("Data: {:?}", data);

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

#[tokio::main]
async fn main() {
    // let github_output_path = env::var("GITHUB_OUTPUT").unwrap();
    // let args: Vec<String> = env::args().collect();
    // let res = list_github_releases("xmrig", "xmrig").await.unwrap();
    // let formatted_res = res
    //     .into_iter()
    //     .map(|info| {
    //         let assets = info
    //             .assets
    //             .into_iter()
    //             .map(|asset| format!("{}: {}", asset.name, asset.url))
    //             .collect::<Vec<_>>()
    //             .join("\n");
    //         format!("Version: {}\nAssets:\n{}", info.version, assets)
    //     })
    //     .collect::<Vec<_>>()
    //     .join("\n\n");
    // println!("{}", formatted_res);
    let res = list_cdn_releases("xmrig")
        .await
        .inspect_err(|e| println!("{:?}", e))
        .unwrap();
}
