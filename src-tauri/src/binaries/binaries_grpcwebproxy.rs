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

use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::error;
use regex::Regex;
use tari_common::configuration::Network;

use crate::{github, progress_tracker_old::ProgressTracker, APPLICATION_FOLDER_ID};

use super::binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo};

const LOG_TARGET: &str = "tari::universe::adapter_grpcwebproxy";

pub struct GrpcWebProxyVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for GrpcWebProxyVersionApiAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let releases = github::list_releases("tari-project", "grpc-web").await?;
        Ok(releases.clone())
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: VersionDownloadInfo,
        _: ProgressTracker,
    ) -> Result<PathBuf, Error> {
        let checksum_path = directory
            .join(format!("grpcwebproxy-{}", download_info.version))
            .join("SHA256SUMS");

        Ok(checksum_path)
    }

    fn get_binary_folder(&self) -> Result<PathBuf, Error> {
        let cache_path =
            dirs::cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

        let binary_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("binaries")
            .join("grpcwebproxy")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !binary_folder_path.exists() {
            std::fs::create_dir_all(&binary_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to create directory: {}", e);
            });
        };

        Ok(binary_folder_path)
    }

    fn find_version_for_platform(
        &self,
        _version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, anyhow::Error> {
        let mut name_suffix = "";
        if cfg!(target_os = "windows") {
            name_suffix = r".*windows-x86_64\.gz";
        }
        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = r".*macos-x86_64\.gz";
        }
        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            name_suffix = r".*macos-arm64\.gz";
        }
        if cfg!(target_os = "linux") {
            name_suffix = r".*linux-x86_64\.gz";
        }
        if cfg!(target_os = "freebsd") {
            name_suffix = r".*freebsd-x86_64\.gz";
        }
        if name_suffix.is_empty() {
            panic!("Unsupported OS");
        }

        let name_sufix_regex = Regex::new(name_suffix)
            .map_err(|error| anyhow::anyhow!("Failed to create regex: {}", error))?;

        let platform = _version
            .assets
            .iter()
            .find(|a| name_sufix_regex.is_match(&a.name))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        Ok(platform.clone())
    }
}
