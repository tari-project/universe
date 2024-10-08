use anyhow::anyhow;
use log::{debug, info, warn};
use reqwest::Client;
use serde::Deserialize;

use crate::binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo};

const LOG_TARGET: &str = "tari::universe::github";

#[derive(Deserialize)]
struct Release {
    name: String,
    tag_name: String,
    draft: bool,
    assets: Vec<Asset>,
}

#[derive(Deserialize, Debug)]
struct Asset {
    name: String,
    browser_download_url: String,
}

#[derive(Debug)]
enum ReleaseSource {
    Github,
    Mirror,
}

pub fn get_gh_url(repo_owner: &str, repo_name: &str) -> String {
    format!(
        "https://api.github.com/repos/{}/{}/releases",
        repo_owner, repo_name
    )
}

pub fn get_mirror_url(repo_owner: &str, repo_name: &str) -> String {
    format!(
        "https://cdn-universe.tari.com/{}/{}/releases/api.json",
        repo_owner, repo_name
    )
}

pub fn get_gh_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!(
        "https://github.com/{}/{}/releases/download",
        repo_owner, repo_name
    )
}

pub fn get_mirror_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!(
        "https://cdn-universe.tari.com/{}/{}/releases/download",
        repo_owner, repo_name
    )
}

pub async fn list_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let mut attempts = 0;
    let releases = loop {
        let result = list_releases_from(ReleaseSource::Mirror, repo_owner, repo_name).await;
        if result.as_ref().map_or(false, |r| !r.is_empty()) || attempts >= 3 {
            break result;
        }
        attempts += 1;
        warn!(
            target: LOG_TARGET,
            "Failed to fetch releases from mirror, attempt {}",
            attempts
        );
    };

    if releases.as_ref().map_or(false, |r| !r.is_empty()) {
        releases
    } else {
        list_releases_from(ReleaseSource::Github, repo_owner, repo_name).await
    }
}

async fn list_releases_from(
    source: ReleaseSource,
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let client = Client::new();
    let url = match source {
        ReleaseSource::Github => get_gh_url(repo_owner, repo_name),
        ReleaseSource::Mirror => get_mirror_url(repo_owner, repo_name),
    };

    let response = client
        .get(&url)
        .header("User-Agent", "request")
        .send()
        .await?;
    if response.status() != 200 {
        return Err(anyhow!(
            "Failed to fetch releases for {}:{}: {} - ",
            repo_owner,
            repo_name,
            response.status()
        ));
    }
    let data = response.text().await?;
    let releases: Vec<Release> = serde_json::from_str(&data)?;

    debug!(target: LOG_TARGET, "Releases for {}/{}:", repo_owner, repo_name);
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
        debug!(target: LOG_TARGET, " - release: {}", release_name);
        // res.push(semver::Version::parse(&tag_name)?);
        let mut assets = vec![];
        for asset in release.assets {
            let url = match source {
                ReleaseSource::Mirror => asset.browser_download_url.replace(
                    &get_gh_download_url(repo_owner, repo_name),
                    &get_mirror_download_url(repo_owner, repo_name),
                ),
                ReleaseSource::Github => asset.browser_download_url,
            };
            assets.push(VersionAsset {
                url,
                name: asset.name,
            });
        }
        match semver::Version::parse(&release_name) {
            Ok(v) => {
                res.push(VersionDownloadInfo { version: v, assets });
            }
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to parse {:?} version: {}", release_name, e);
                continue;
            }
        }
    }

    Ok(res)
}
