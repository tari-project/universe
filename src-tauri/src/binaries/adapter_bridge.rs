// Copyright 2024. The Tari Project
//
// Redistribution and use in source and tapplet forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in tapplet form must reproduce the above copyright notice, this list of conditions and the
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

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC,
    requests::{
        clients::http_file_client::HttpFileClient, get_gh_download_url, get_mirror_download_url,
    },
};
use anyhow::{Error, anyhow};
use async_trait::async_trait;
use log::{error, info};
use regex::Regex;
use tari_common::configuration::Network;
use tokio::{fs::File, io::AsyncReadExt};

use super::binaries_resolver::{BinaryDownloadInfo, LatestVersionApiAdapter};

pub struct BridgeTappletAdapter {
    pub repo: String,
    pub owner: String,
}

#[async_trait]
impl LatestVersionApiAdapter for BridgeTappletAdapter {
    async fn get_expected_checksum(
        &self,
        checksum_path: PathBuf,
        asset_name: &str,
    ) -> Result<String, Error> {
        let mut file_sha256 = File::open(checksum_path.clone()).await?;
        let mut buffer_sha256 = Vec::new();
        file_sha256.read_to_end(&mut buffer_sha256).await?;
        let contents = String::from_utf8(buffer_sha256)
            .map_err(|e| anyhow!("Checksum file is not valid UTF-8: {}", e))?;
        let mut expected_hash = "";
        let escaped_asset_name = regex::escape(asset_name);
        let regex = Regex::new(&format!(r"([a-fA-F0-9]{{64}})\s+\*?{escaped_asset_name}$"))
            .map_err(|e| anyhow!("Failed to create regex: {}", e))?;

        for line in contents.lines() {
            if let Some(caps) = regex.captures(line.trim()) {
                expected_hash = caps
                    .get(1)
                    .map(|hash| hash.as_str())
                    .ok_or_else(|| anyhow!("Failed to extract hash from line: {}", line))?;
            }
        }

        // Fail closed: an empty expected hash would otherwise be compared against the
        // real digest and produce a confusing "checksums mismatched" error, and any
        // future change that treats an empty expectation as "skip" would silently serve
        // unverified tapplet content into the wallet-connected iframe.
        if expected_hash.is_empty() {
            error!(target: LOG_TARGET_APP_LOGIC, "No checksum entry for asset {asset_name} in {checksum_path:?}");
            return Err(anyhow!(
                "Checksum file does not contain an entry for asset '{}'",
                asset_name
            ));
        }

        // `validate_checksum` compares against a lowercase `{:x}` digest byte for byte, so
        // an uppercase entry (accepted by the regex above) has to be folded first.
        Ok(expected_hash.to_ascii_lowercase())
    }
    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let checksum_url = format!("{}.sha256", download_info.main_url);

        match HttpFileClient::builder()
            .with_cloudflare_cache_check()
            .build(checksum_url.clone(), directory.clone())?
            .execute()
            .await
        {
            Ok(checksum_path) => Ok(checksum_path),
            Err(_) => {
                let checksum_fallback_url = format!("{}.sha256", download_info.fallback_url);
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

        let tapplet_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("tapplets")
            .join("bridge")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !tapplet_folder_path.exists() {
            std::fs::create_dir_all(&tapplet_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to create directory: {e}");
            });
        };

        Ok(tapplet_folder_path)
    }

    fn get_base_main_download_url(&self, version: &str) -> String {
        let base_url = get_mirror_download_url(&self.owner, &self.repo);
        format!("{base_url}/v{version}")
    }
    fn get_base_fallback_download_url(&self, version: &str) -> String {
        let base_url = get_gh_download_url(&self.owner, &self.repo);
        format!("{base_url}/v{version}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn adapter() -> BridgeTappletAdapter {
        BridgeTappletAdapter {
            repo: "wxtm-bridge-frontend".to_string(),
            owner: "tari-project".to_string(),
        }
    }

    fn checksum_file(contents: &str) -> tempfile::NamedTempFile {
        let mut file = tempfile::NamedTempFile::new().expect("temp file");
        file.write_all(contents.as_bytes()).expect("write");
        file.flush().expect("flush");
        file
    }

    /// The format actually published on `tari-project/wxtm-bridge-frontend` releases.
    #[tokio::test]
    async fn parses_sha256sum_output() {
        let file = checksum_file(
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b  bridge-v0.4.2.zip\n",
        );
        let hash = adapter()
            .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
            .await
            .expect("checksum parsed");

        assert_eq!(
            hash,
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b"
        );
    }

    #[tokio::test]
    async fn folds_uppercase_digest_to_lowercase() {
        let file = checksum_file(
            "8D33B2E49EB7CA91684FE358DB1AAC1B07E4E3A87D0CAE993C6F48B6A1AEE97B  bridge-v0.4.2.zip\n",
        );
        let hash = adapter()
            .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
            .await
            .expect("checksum parsed");

        assert_eq!(
            hash,
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b"
        );
    }

    #[tokio::test]
    async fn parses_binary_mode_entry() {
        let file = checksum_file(
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b *bridge-v0.4.2.zip\n",
        );
        let hash = adapter()
            .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
            .await
            .expect("checksum parsed");

        assert_eq!(
            hash,
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b"
        );
    }

    #[tokio::test]
    async fn picks_the_entry_for_the_requested_asset() {
        let file = checksum_file(
            "1111111111111111111111111111111111111111111111111111111111111111  bridge-v0.4.1.zip\n\
             2222222222222222222222222222222222222222222222222222222222222222  bridge-v0.4.2.zip\n",
        );
        let hash = adapter()
            .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
            .await
            .expect("checksum parsed");

        assert_eq!(
            hash,
            "2222222222222222222222222222222222222222222222222222222222222222"
        );
    }

    /// An unparseable or wrong checksum file must fail closed rather than yield an empty
    /// expectation that a future refactor could read as "nothing to verify".
    #[tokio::test]
    async fn missing_entry_is_an_error() {
        let file = checksum_file(
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b  some-other-asset.zip\n",
        );
        let err = adapter()
            .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
            .await
            .expect_err("no entry for the asset");

        assert!(err.to_string().contains("does not contain an entry"));
    }

    #[tokio::test]
    async fn html_error_page_is_an_error() {
        let file = checksum_file("<!doctype html><html><body>404</body></html>");
        assert!(
            adapter()
                .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
                .await
                .is_err(),
            "a mirror error page must never be accepted as a checksum"
        );
    }

    /// The asset name is interpolated into a regex, so it must be escaped: `.` and `-`
    /// in `bridge-v0.4.2.zip` must not match arbitrary characters.
    #[tokio::test]
    async fn asset_name_is_not_treated_as_a_pattern() {
        let file = checksum_file(
            "8d33b2e49eb7ca91684fe358db1aac1b07e4e3a87d0cae993c6f48b6a1aee97b  bridgeXv0X4X2Xzip\n",
        );
        assert!(
            adapter()
                .get_expected_checksum(file.path().to_path_buf(), "bridge-v0.4.2.zip")
                .await
                .is_err()
        );
    }
}
