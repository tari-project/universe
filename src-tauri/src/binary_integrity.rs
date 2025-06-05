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

use crate::binaries::{Binaries, BinaryResolver};
use crate::download_utils::validate_checksum;
use log::{debug, error, info, warn};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::fs::File;
use tokio::io::AsyncReadExt;

const LOG_TARGET: &str = "tari::universe::binary_integrity";

#[derive(Debug, Clone)]
pub struct BinaryIntegrityChecker;

impl BinaryIntegrityChecker {
    /// Validate binary against expected checksum from binaries manager
    pub async fn validate_binary_integrity(
        binary_path: &Path,
        binary: Binaries,
    ) -> Result<bool, anyhow::Error> {
        if !binary_path.exists() {
            return Err(anyhow::anyhow!("Binary file does not exist: {:?}", binary_path));
        }

        debug!(target: LOG_TARGET, "Validating binary integrity for {:?}", binary_path);

        // Get expected checksum from BinaryResolver
        let resolver = BinaryResolver::current().read().await;
        let expected_checksum = match resolver.get_binary_checksum(binary).await {
            Ok(checksum) => checksum,
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not get expected checksum for binary {:?}: {}", binary, e);
                // If we can't get the expected checksum, we can't validate
                return Ok(true);
            }
        };

        // Use existing validate_checksum function
        match validate_checksum(binary_path.to_path_buf(), expected_checksum).await {
            Ok(_) => {
                debug!(target: LOG_TARGET, "Binary integrity validation passed for {:?}", binary_path);
                Ok(true)
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Binary integrity validation failed for {:?}: {}", binary_path, e);
                Ok(false)
            }
        }
    }

    /// Calculate and cache binary hash for runtime checks
    pub async fn cache_binary_hash(binary_path: &Path) -> Result<String, anyhow::Error> {
        debug!(target: LOG_TARGET, "Calculating hash for binary: {:?}", binary_path);
        Self::calculate_file_hash(binary_path).await
    }

    /// Quick integrity check using cached hash
    pub async fn verify_cached_integrity(
        binary_path: &Path,
        cached_hash: &str,
    ) -> Result<bool, anyhow::Error> {
        if !binary_path.exists() {
            return Ok(false);
        }

        let current_hash = Self::calculate_file_hash(binary_path).await?;
        let is_valid = current_hash == cached_hash;

        if is_valid {
            debug!(target: LOG_TARGET, "Cached integrity check passed for {:?}", binary_path);
        } else {
            warn!(target: LOG_TARGET, "Cached integrity check failed for {:?}. Expected: {}, Got: {}", 
                  binary_path, cached_hash, current_hash);
        }

        Ok(is_valid)
    }

    /// Handle corruption detection (trigger re-download, emit events)
    pub async fn handle_corruption(
        binary: Binaries,
        binary_path: &Path,
    ) -> Result<PathBuf, anyhow::Error> {
        error!(target: LOG_TARGET, "Binary corruption detected for {:?} at {:?}", binary, binary_path);

        // Try to re-download the binary using existing infrastructure
        let resolver = BinaryResolver::current().read().await;
        match resolver.ensure_binary_is_available(binary, true).await {
            Ok(new_path) => {
                info!(target: LOG_TARGET, "Successfully re-downloaded corrupted binary {:?} to {:?}", binary, new_path);
                Ok(new_path)
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to re-download corrupted binary {:?}: {}", binary, e);
                Err(anyhow::anyhow!("Failed to recover from binary corruption: {}", e))
            }
        }
    }

    /// Calculate SHA256 hash of a file
    async fn calculate_file_hash(file_path: &Path) -> Result<String, anyhow::Error> {
        let mut file = File::open(file_path).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;

        let mut hasher = Sha256::new();
        hasher.update(&buffer);
        let hash = hasher.finalize();
        Ok(format!("{:x}", hash))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[tokio::test]
    async fn test_calculate_file_hash() {
        // Create a temporary file with known content
        let mut temp_file = NamedTempFile::new().unwrap();
        temp_file.write_all(b"test content").unwrap();
        temp_file.flush().unwrap();

        let hash = BinaryIntegrityChecker::calculate_file_hash(temp_file.path())
            .await
            .unwrap();

        // Verify the hash is calculated correctly
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64); // SHA256 produces 64 character hex string
    }

    #[tokio::test]
    async fn test_verify_cached_integrity() {
        // Create a temporary file
        let mut temp_file = NamedTempFile::new().unwrap();
        temp_file.write_all(b"test content").unwrap();
        temp_file.flush().unwrap();

        // Calculate initial hash
        let initial_hash = BinaryIntegrityChecker::cache_binary_hash(temp_file.path())
            .await
            .unwrap();

        // Verify integrity with correct hash
        let is_valid = BinaryIntegrityChecker::verify_cached_integrity(temp_file.path(), &initial_hash)
            .await
            .unwrap();
        assert!(is_valid);

        // Verify integrity fails with wrong hash
        let is_invalid = BinaryIntegrityChecker::verify_cached_integrity(temp_file.path(), "wrong_hash")
            .await
            .unwrap();
        assert!(!is_invalid);
    }
}
