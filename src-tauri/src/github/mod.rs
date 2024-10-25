mod cache;
pub mod request_client;

use cache::CacheJsonFile;
use log::{debug, info, warn};
use request_client::RequestClient;
use reqwest::Response;
use serde::{Deserialize, Serialize};

use crate::{
    binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo},
    APPLICATION_FOLDER_ID,
};

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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReleaseSource {
    Github,
    Mirror,
}

impl ReleaseSource {
    pub fn to_string(&self) -> String {
        match self {
            ReleaseSource::Github => "Github".to_string(),
            ReleaseSource::Mirror => "Mirror".to_string(),
        }
    }

    pub fn is_github(&self) -> bool {
        match self {
            ReleaseSource::Github => true,
            _ => false,
        }
    }

    pub fn is_mirror(&self) -> bool {
        match self {
            ReleaseSource::Mirror => true,
            _ => false,
        }
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
    CacheJsonFile::current()
        .write()
        .await
        .read_version_releases_responses_cache_file()?;

    let mut mirror_releases = list_mirror_releases(repo_owner, repo_name)
        .await
        .inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to fetch releases from Github: {}", e);
        })
        .unwrap_or_default();
    // Add any missing releases from github
    let github_releases = list_github_releases(repo_owner, repo_name)
        .await
        .inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to fetch releases from Github: {}", e);
        })
        .unwrap_or_default();

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
    let mut cache_json_file_lock = CacheJsonFile::current().write().await;
    let url = get_mirror_url(repo_owner, repo_name);

    let (need_to_download, cache_entry_present,response) =
        check_if_need_download(repo_owner, repo_name, &url, ReleaseSource::Mirror).await?;

    let mut versions_list: Vec<VersionDownloadInfo> = vec![];
    let mut does_hit = response.and_then(|res| {
        Some(RequestClient::current().get_cf_cache_status_from_head_response(&res).is_hit())
    }).unwrap_or(false);



    if need_to_download && !does_hit {
        does_hit = RequestClient::current().check_if_cache_hits(&url).await?;
    }

    if does_hit {
        let (response, etag) = RequestClient::current()
            .fetch_get_versions_download_info(&url)
            .await?;
        let remote_versions_list =
            extract_versions_from_release(repo_owner, repo_name, response, ReleaseSource::Mirror)
                .await?;
        let content_path =
            cache_json_file_lock.save_file_content(repo_owner, repo_name, versions_list.clone())?;

        let args = (repo_owner, repo_name, content_path, Some(etag), None);
        if cache_entry_present {
            cache_json_file_lock.update_cache_entry(args.0, args.1, args.2, args.3, args.4)?;
        } else {
            cache_json_file_lock.create_cache_entry(args.0, args.1, args.2, args.3, args.4)?;
        };

        versions_list.extend(remote_versions_list);
    } else {
        let content = cache_json_file_lock.get_file_content(repo_owner, repo_name)?;
        versions_list.extend(content);
    }

    Ok(versions_list)
}

async fn list_github_releases(
    repo_owner: &str,
    repo_name: &str,
) -> Result<Vec<VersionDownloadInfo>, anyhow::Error> {
    let mut cache_json_file_lock = CacheJsonFile::current().write().await;
    let url = get_gh_url(repo_owner, repo_name);

    let (need_to_download, cache_entry_present,response) =
        check_if_need_download(repo_owner, repo_name, &url, ReleaseSource::Github).await?;

    let mut versions_list: Vec<VersionDownloadInfo> = vec![];

    if need_to_download {
        let (response, etag) = RequestClient::current()
            .fetch_get_versions_download_info(&url)
            .await?;
        let remote_versions_list =
            extract_versions_from_release(repo_owner, repo_name, response, ReleaseSource::Github)
                .await?;
        let content_path =
            cache_json_file_lock.save_file_content(repo_owner, repo_name, versions_list.clone())?;

        let args = (repo_owner, repo_name, content_path, Some(etag), None);
        if cache_entry_present {
            cache_json_file_lock.update_cache_entry(args.0, args.1, args.2, args.3, args.4)?;
        } else {
            cache_json_file_lock.create_cache_entry(args.0, args.1, args.2, args.3, args.4)?;
        };

        versions_list.extend(remote_versions_list);
    } else {
        let content = cache_json_file_lock.get_file_content(repo_owner, repo_name)?;
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
    let cache_json_file_lock = CacheJsonFile::current().write().await;
    let cache_entry = cache_json_file_lock.get_cache_entry(repo_owner, repo_name);
    let mut need_to_download = false;
    let cache_entry_present = cache_entry.is_some();

    match cache_entry {
        Some(cache_entry) => {
            if !cache_json_file_lock.chech_if_content_file_exist(repo_owner, repo_name) {
                need_to_download = true;
            }

            let response = RequestClient::current().send_head_request(&url).await?;
            let remote_etag = RequestClient::current().get_etag_from_head_response(&response);
            let local_etag = match source {
                ReleaseSource::Mirror => cache_entry.mirror_etag.clone(),
                ReleaseSource::Github => cache_entry.github_etag.clone(),
            };

            if !remote_etag.eq(&local_etag.unwrap_or("".to_string())) {
                need_to_download = true
            };

                Ok((need_to_download, cache_entry_present,Some(response)))
        }
        None => {
            need_to_download = true;
                Ok((need_to_download, cache_entry_present,None))
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
