mod cache;
mod request_client;

use std::path::{Path, PathBuf};

use request_client::{ CloudFlareCacheStatus, RequestClient };
use cache::CacheJsonFile;
use anyhow::anyhow;
use log::{debug, info, warn};
use reqwest::Client;
use serde::Deserialize;

use crate::{binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo}, APPLICATION_FOLDER_ID};

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

#[derive(Debug,Clone)]
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

    CacheJsonFile::current().write().await.read_version_releases_responses_cache_file()?;

    let mut attempts = 0;
    let mut releases = loop {
        match list_releases_from(ReleaseSource::Mirror, repo_owner, repo_name).await {
            Ok(r) => break r,
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to fetch releases from mirror: {}", e);
            }
        };
        attempts += 1;
        warn!(
            target: LOG_TARGET,
            "Failed to fetch releases from mirror, attempt {}",
            attempts
        );
    };
    // Add any missing releases from github
    let github_releases = list_releases_from(ReleaseSource::Github, repo_owner, repo_name)
        .await
        .inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to fetch releases from Github: {}", e);
        })
        .unwrap_or_default();

    for release in &github_releases {
        if !releases.iter().any(|r| r.version == release.version) {
            releases.push(release.clone());
        }
    }
    Ok(releases)

    // if releases.as_ref().map_or(false, |r| !r.is_empty()) {
    //     releases
    // } else {
    //     list_releases_from(ReleaseSource::Github, repo_owner, repo_name).await
    // }
}

async fn list_releases_from(
    source: ReleaseSource,
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let cache_json_file_lock = CacheJsonFile::current().write().await;

    let client = Client::new();
    let url: String = match source {
        ReleaseSource::Github => get_gh_url(repo_owner, repo_name),
        ReleaseSource::Mirror => get_mirror_url(repo_owner, repo_name),
    };

    let cache_entry = cache_json_file_lock.get_cache_entry(repo_owner, repo_name);
    let was_content_downloaded = false;

    let (releases, etag) = match cache_entry {
        Some( cache_entry ) => {
            let remote_etag = RequestClient::current().fetch_head_etag(&url).await?;
            let local_etag = match source {
                ReleaseSource::Mirror => cache_entry.mirror_etag.clone(),
                ReleaseSource::Github => cache_entry.github_etag.clone(),
            };

            if remote_etag.eq(&local_etag.unwrap_or("".to_string())) {
                match cache_json_file_lock.get_file_content(repo_owner, repo_name) {
                    Ok(content) => (content, remote_etag),
                    Err(e) => {
                        was_content_downloaded = true;
                        RequestClient::current().fetch_get_versions_download_info(&url).await?
                    }
                }
            } else {
                was_content_downloaded = true;
                RequestClient::current().fetch_get_versions_download_info(&url).await?
            }
        },
        None => {
            was_content_downloaded = true;
            RequestClient::current().fetch_get_versions_download_info(&url).await?
        }
    };


    if was_content_downloaded {
        cache_json_file_lock.save_file_content(repo_owner, repo_name, releases.clone())?;
    }


    // let head_response = client
    //     .head(&url)
    //     .header("User-Agent", "request")
    //     .send()
    //     .await?;

    // let response_etag = head_response
    //     .headers()
    //     .get("etag")
    //     .map(|v| v.to_str().unwrap_or_default())
    //     .unwrap_or_default();

    
    // let is_cache_valid = entry.map_or(false, |e| e.e_tag == response_etag);
    
    // info!(
    //     target: LOG_TARGET,
    //     "Cache for {}/{} is valid: {}",
    //     repo_owner,
    //     repo_name,
    //     is_cache_valid
    // );

    // let releases = if is_cache_valid {
    //     // return stored content
    //     vec![]
    // } else {
    //     // fetch new content
    //     let response = client
    //         .get(&url)
    //         .header("User-Agent", "request")
    //         .send()
    //         .await?;


    //     if response.status() != 200 {
    //         return Err(anyhow!(
    //             "Failed to fetch releases for {}:{}: {} - ",
    //             repo_owner,
    //             repo_name,
    //             response.status()
    //         ));
    //     }
    //     let data = response.text().await?;
    //     let releases: Vec<Release> = serde_json::from_str(&data)?;

    //     releases
    // };


    // CacheJsonFile::current().write().await.set_entry(repo_owner, repo_name, source.clone(), response_etag.to_string())?;

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

    // save res to cache

    Ok(res)
}
