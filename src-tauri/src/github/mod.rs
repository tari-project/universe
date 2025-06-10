// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

mod cache;
pub mod request_client;

use cache::CacheJsonFile;
use log::{debug, info, warn};
use request_client::RequestClient;
use reqwest::Response;
use serde::{Deserialize, Serialize};

use crate::binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo};

const LOG_TARGET: &str = "tari::universe::github";

#[derive(Deserialize)]
pub struct Release {
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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReleaseSource {
    Github,
    Mirror,
}

impl ReleaseSource {
    pub fn is_mirror(&self) -> bool {
        matches!(self, ReleaseSource::Mirror)
    }
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
    info!(target: LOG_TARGET, "Reading cache releases for {}/{}", repo_owner, repo_name);
    CacheJsonFile::current()
        .write()
        .await
        .read_version_releases_responses_cache_file()?;

    debug!(target: LOG_TARGET, "Fetching mirror releases for {}/{}", repo_owner, repo_name);

    let mut mirror_releases = list_mirror_releases(repo_owner, repo_name)
        .await
        .inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to fetch releases from Mirror: {}", e);
        })
        .unwrap_or_default();

    debug!(target: LOG_TARGET, "Found {} releases from mirror", mirror_releases.len());

    debug!(target: LOG_TARGET, "Fetching github releases for {}/{}", repo_owner, repo_name);

    let github_releases = list_github_releases(repo_owner, repo_name)
        .await
        .inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to fetch releases from Github: {}", e);
        })
        .unwrap_or_default();

    debug!(target: LOG_TARGET, "Found {} releases from Github", github_releases.len());

    // Add any missing releases from github
    for release in &github_releases {
        if !mirror_releases.iter().any(|r| r.version == release.version) {
            mirror_releases.push(release.clone());
        }
    }
    Ok(mirror_releases)

    // if releases.as_ref().map_or(false, |r| !r.is_empty()) {
    //     releases
    // } else {
    //     list_releases_from(ReleaseSource::Github, repo_owner, repo_name).await
    // }
}

async fn list_mirror_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let url = get_mirror_url(repo_owner, repo_name);
    info!(target: LOG_TARGET, "Mirror releases url: {}", url);

    let (need_to_download, cache_entry_present, _) =
        check_if_need_download(repo_owner, repo_name, &url, ReleaseSource::Mirror).await?;

    debug!(target: LOG_TARGET, "Mirror releases need to download: {}", need_to_download);
    debug!(target: LOG_TARGET, "Mirror releases cache entry present: {}", cache_entry_present);

    let mut versions_list: Vec<VersionDownloadInfo> = vec![];

    let mut cache_json_file_lock = CacheJsonFile::current().write().await;

    if need_to_download {
        //TODO (1/2) bring it back once cloudflare stops returning dynamic status
        // RequestClient::current().check_if_cache_hits(&url).await?;
        let (response, etag) = RequestClient::current()
            .fetch_get_versions_download_info(&url)
            .await?;
        let remote_versions_list =
            extract_versions_from_release(repo_owner, repo_name, response, ReleaseSource::Mirror)
                .await?;

        if cache_entry_present {
            cache_json_file_lock.update_cache_entry(repo_owner, repo_name, None, Some(etag))?;
        } else {
            cache_json_file_lock.create_cache_entry(repo_owner, repo_name, None, Some(etag))?;
        };
        versions_list.extend(remote_versions_list);
        cache_json_file_lock.save_file_content(
            repo_owner,
            repo_name,
            versions_list.clone(),
            ReleaseSource::Mirror,
        )?;
    } else {
        let content =
            cache_json_file_lock.get_file_content(repo_owner, repo_name, ReleaseSource::Mirror)?;
        versions_list.extend(content);
    }

    Ok(versions_list)
}

async fn list_github_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let url = get_gh_url(repo_owner, repo_name);
    info!(target: LOG_TARGET, "Github releases url: {}", url);

    let (need_to_download, cache_entry_present, _) =
        check_if_need_download(repo_owner, repo_name, &url, ReleaseSource::Github).await?;

    debug!(target: LOG_TARGET, "Github releases need to download: {}", need_to_download);
    debug!(target: LOG_TARGET, "Github releases cache entry present: {}", cache_entry_present);

    let mut versions_list: Vec<VersionDownloadInfo> = vec![];

    let mut cache_json_file_lock = CacheJsonFile::current().write().await;

    if need_to_download {
        let (response, etag) = RequestClient::current()
            .fetch_get_versions_download_info(&url)
            .await?;
        let remote_versions_list =
            extract_versions_from_release(repo_owner, repo_name, response, ReleaseSource::Github)
                .await?;

        if cache_entry_present {
            cache_json_file_lock.update_cache_entry(repo_owner, repo_name, Some(etag), None)?;
        } else {
            cache_json_file_lock.create_cache_entry(repo_owner, repo_name, Some(etag), None)?;
        };

        versions_list.extend(remote_versions_list);
        cache_json_file_lock.save_file_content(
            repo_owner,
            repo_name,
            versions_list.clone(),
            ReleaseSource::Github,
        )?;
    } else {
        let content =
            cache_json_file_lock.get_file_content(repo_owner, repo_name, ReleaseSource::Github)?;
        versions_list.extend(content);
    }

    Ok(versions_list)
}

async fn check_if_need_download(
    repo_owner: &str,
    repo_name: &str,
    url: &str,
    source: ReleaseSource,
) -> Result<(bool, bool, Option<Response>), anyhow::Error> {
    let cache_json_file_lock = CacheJsonFile::current().read().await;
    let cache_entry = cache_json_file_lock.get_cache_entry(repo_owner, repo_name);
    let mut need_to_download = false;
    let cache_entry_present: bool = cache_entry.is_some();

    match cache_entry {
        Some(cache_entry) => {
            if !cache_json_file_lock.check_if_content_file_exist(
                repo_owner,
                repo_name,
                source.clone(),
            ) {
                need_to_download = true;
            }

            let response = RequestClient::current().send_head_request(url).await?;
            let remote_etag = RequestClient::current().get_etag_from_head_response(&response);
            let local_etag = match source {
                ReleaseSource::Mirror => cache_entry.mirror_etag.clone(),
                ReleaseSource::Github => cache_entry.github_etag.clone(),
            };

            debug!(target: LOG_TARGET, "Remote etag: {}", remote_etag);
            debug!(target: LOG_TARGET, "Local etag: {:?}", cache_entry);

            if !remote_etag.eq(&local_etag.unwrap_or("".to_string())) {
                need_to_download = true
            };

            Ok((need_to_download, cache_entry_present, Some(response)))
        }
        None => {
            need_to_download = true;
            Ok((need_to_download, cache_entry_present, None))
        }
    }
}

async fn extract_versions_from_release(
    repo_owner: &str,
    repo_name: &str,
    releases: Vec<Release>,
    source: ReleaseSource,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let mut versions_list = vec![];
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
        let mut assets = vec![];
        for asset in release.assets {
            let url = match source {
                ReleaseSource::Mirror => asset.browser_download_url.replace(
                    &get_gh_download_url(repo_owner, repo_name),
                    &get_mirror_download_url(repo_owner, repo_name),
                ),
                ReleaseSource::Github => asset.browser_download_url.clone(),
            };
            let fallback_url: Option<String> = match source {
                ReleaseSource::Mirror => Some(asset.browser_download_url),
                ReleaseSource::Github => None,
            };
            assets.push(VersionAsset {
                url,
                fallback_url,
                name: asset.name,
                source: source.clone(),
            });
        }
        match semver::Version::parse(&release_name) {
            Ok(v) => {
                versions_list.push(VersionDownloadInfo { version: v, assets });
            }
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to parse {:?} version: {}", release_name, e);
                continue;
            }
        }
    }

    Ok(versions_list)
}
