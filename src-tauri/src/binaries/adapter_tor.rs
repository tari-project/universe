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

use crate::binaries::binaries_resolver::LatestVersionApiAdapter;
use crate::requests::clients::http_file_client::HttpFileClient;
use crate::{APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC};
use anyhow::Error;
use async_trait::async_trait;
use log::info;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

use super::adapter_github::{parse_expected_checksum, sibling_release_file};
use super::binaries_resolver::BinaryDownloadInfo;

pub(crate) struct TorReleaseAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for TorReleaseAdapter {
    async fn get_expected_checksum(
        &self,
        checksum_path: PathBuf,
        asset_name: &str,
    ) -> Result<String, Error> {
        let mut file_sha256 = File::open(checksum_path.clone()).await?;
        let mut buffer_sha256 = Vec::new();
        file_sha256.read_to_end(&mut buffer_sha256).await?;
        // Lossy rather than a panic: this runs inside a spawned setup phase task, so a mirror or a
        // captive portal serving a compressed or HTML body here would abort the task without ever
        // sending a PhaseStatus, leaving the phase reporting Initializing forever.
        let contents = String::from_utf8_lossy(&buffer_sha256);

        parse_expected_checksum(&contents, asset_name)
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let checksum_url =
            sibling_release_file(&download_info.main_url, "sha256sums-signed-build.txt");

        match HttpFileClient::builder()
            .with_cloudflare_cache_check()
            .build(checksum_url.clone(), directory.clone())?
            .execute()
            .await
        {
            Ok(checksum_path) => Ok(checksum_path),
            Err(_) => {
                let checksum_fallback_url = sibling_release_file(
                    &download_info.fallback_url,
                    "sha256sums-signed-build.txt",
                );
                info!(target: LOG_TARGET_APP_LOGIC, "Fallback URL: {checksum_fallback_url}");
                HttpFileClient::builder()
                    .build(checksum_fallback_url.clone(), directory.clone())?
                    .execute()
                    .await
            }
        }
    }

    fn get_binary_folder(&self) -> Result<PathBuf, Error> {
        let cache_path =
            dirs::cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

        let binary_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("binaries")
            .join("tor-binaries")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        std::fs::create_dir_all(&binary_folder_path)?;
        crate::private_directory::restrict_directory(&binary_folder_path)?;

        Ok(binary_folder_path)
    }

    fn get_base_main_download_url(&self, version: &str) -> String {
        let base_url = "https://cdn-universe.tari.com/tor-package-archive/torbrowser".to_string();
        format!("{base_url}/{version}")
    }
    fn get_base_fallback_download_url(&self, version: &str) -> String {
        let base_url = "https://archive.torproject.org/tor-package-archive/torbrowser".to_string();
        format!("{base_url}/{version}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn checksum_manifest_uses_version_directory() {
        assert_eq!(
            sibling_release_file(
                "https://archive.torproject.org/tor-package-archive/torbrowser/15.0.5/tor-expert-bundle-linux-x86_64-15.0.5.tar.gz",
                "sha256sums-signed-build.txt"
            ),
            "https://archive.torproject.org/tor-package-archive/torbrowser/15.0.5/sha256sums-signed-build.txt"
        );
    }

    #[tokio::test]
    async fn checksum_manifest_uses_the_exact_asset_entry() {
        let dir = tempfile::tempdir().expect("temporary directory");
        let manifest = dir.path().join("SHA256SUMS");
        std::fs::write(
            &manifest,
            format!(
                "{}  tor.zip.sig\n{}  tor.zip\n",
                "0".repeat(64),
                "1".repeat(64)
            ),
        )
        .expect("write manifest");
        let checksum = TorReleaseAdapter {}
            .get_expected_checksum(manifest, "tor.zip")
            .await
            .expect("checksum");
        assert_eq!(checksum, "1".repeat(64));
    }

    #[tokio::test]
    async fn spoofed_or_malformed_tor_entry_rejected() {
        let asset = "tor-expert-bundle-linux-x86_64-15.0.5.tar.gz";
        for entry in [
            format!("{}  {asset}.asc", "a".repeat(64)),
            format!("bad  {asset}"),
            format!("<html>error {asset}</html>"),
        ] {
            let mut file = tempfile::NamedTempFile::new().expect("test fixture succeeds");
            file.write_all(entry.as_bytes())
                .expect("test fixture succeeds");
            assert!(
                TorReleaseAdapter {}
                    .get_expected_checksum(file.path().to_path_buf(), asset)
                    .await
                    .is_err(),
                "accepted {entry}"
            );
        }
    }
}
