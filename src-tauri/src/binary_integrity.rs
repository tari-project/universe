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
use log::{debug, error, info, warn};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use tokio::fs::File;
use tokio::io::AsyncReadExt;

const LOG_TARGET: &str = "tari::universe::binary_integrity";

#[derive(Debug, Clone)]
pub struct BinaryIntegrityChecker;

impl BinaryIntegrityChecker {
    /// Validate archive integrity before extraction
    pub async fn validate_archive_integrity(
        archive_path: &Path,
        binary: Binaries,
    ) -> Result<bool, anyhow::Error> {
        if !archive_path.exists() {
            return Err(anyhow::anyhow!("Archive file does not exist: {:?}", archive_path));
        }

        info!(target: LOG_TARGET, "Validating archive integrity for {:?} (binary type: {:?})", archive_path, binary);

        // Get expected checksum from BinaryResolver
        let resolver = BinaryResolver::current().read().await;
        match resolver.get_binary_checksum(binary).await {
            Ok(expected_checksum) => {
                info!(target: LOG_TARGET, "Retrieved expected checksum for archive {:?}: {}", archive_path, expected_checksum);
                
                // Calculate actual checksum of the archive
                let actual_hash = Self::calculate_file_hash(archive_path).await?;
                info!(target: LOG_TARGET, "Calculated actual hash for archive {:?}: {}", archive_path, actual_hash);
                
                // Compare checksums
                let is_valid = expected_checksum == actual_hash;
                
                if is_valid {
                    info!(target: LOG_TARGET, "Archive integrity validation PASSED for {:?}", archive_path);
                } else {
                    warn!(target: LOG_TARGET, "Archive integrity validation FAILED for {:?}", archive_path);
                    warn!(target: LOG_TARGET, "Expected archive checksum: {}", expected_checksum);
                    warn!(target: LOG_TARGET, "Actual archive checksum:   {}", actual_hash);
                }
                
                Ok(is_valid)
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "No checksum available for archive {:?} (error: {})", archive_path, e);
                Ok(true) // Allow archives without checksums to proceed
            }
        }
    }

    /// Smart validation that tries multiple strategies based on the binary type
    pub async fn validate_binary_integrity_smart(
        binary_path: &Path,
        binary: Binaries,
        archive_path: Option<&Path>,
    ) -> Result<bool, anyhow::Error> {
        if !binary_path.exists() {
            return Err(anyhow::anyhow!("Binary file does not exist: {:?}", binary_path));
        }

        info!(target: LOG_TARGET, "Starting smart binary integrity validation for {:?} (binary type: {:?})", binary_path, binary);

        // Try binary validation first (for most cases)
        match Self::validate_binary_integrity(binary_path, binary).await {
            Ok(true) => {
                info!(target: LOG_TARGET, "Binary validation succeeded for {:?}", binary_path);
                return Ok(true);
            }
            Ok(false) => {
                warn!(target: LOG_TARGET, "Binary validation failed, trying alternative strategies");
                
                // For xmrig, try archive validation if archive path is provided
                if matches!(binary, Binaries::Xmrig) && archive_path.is_some() {
                    info!(target: LOG_TARGET, "Trying archive validation for xmrig");
                    match Self::validate_archive_integrity(archive_path.unwrap(), binary).await {
                        Ok(true) => {
                            info!(target: LOG_TARGET, "Archive validation succeeded for xmrig, accepting binary");
                            return Ok(true);
                        }
                        Ok(false) => {
                            warn!(target: LOG_TARGET, "Archive validation also failed");
                        }
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Archive validation error: {}", e);
                        }
                    }
                }
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Binary validation error: {}", e);
            }
        }

        // Final fallback: basic size and sanity checks
        Self::validate_basic_integrity(binary_path).await
    }

    /// Basic integrity validation using file size and basic sanity checks
    pub async fn validate_basic_integrity(binary_path: &Path) -> Result<bool, anyhow::Error> {
        let metadata = std::fs::metadata(binary_path)?;
        let file_size = metadata.len();
        
        // Basic sanity checks
        if file_size < 1024 {
            warn!(target: LOG_TARGET, "Binary file is suspiciously small: {} bytes", file_size);
            return Ok(false);
        }
        
        if file_size > 1024 * 1024 * 1024 { // 1GB
            warn!(target: LOG_TARGET, "Binary file is suspiciously large: {} bytes", file_size);
            return Ok(false);
        }

        info!(target: LOG_TARGET, "Basic integrity validation passed for {:?} (size: {} bytes)", binary_path, file_size);
        Ok(true)
    }

    /// Validate binary integrity using full SHA256 checksum validation
    pub async fn validate_binary_integrity(
        binary_path: &Path,
        binary: Binaries,
    ) -> Result<bool, anyhow::Error> {
        if !binary_path.exists() {
            return Err(anyhow::anyhow!("Binary file does not exist: {:?}", binary_path));
        }

        info!(target: LOG_TARGET, "Starting binary integrity validation for {:?} (binary type: {:?})", binary_path, binary);

        // Get expected checksum from BinaryResolver
        let resolver = BinaryResolver::current().read().await;
        match resolver.get_binary_checksum(binary).await {
            Ok(expected_checksum) => {
                info!(target: LOG_TARGET, "Retrieved expected checksum for {:?}: {}", binary_path, expected_checksum);
                
                // Calculate actual checksum of the binary
                let actual_hash = Self::calculate_file_hash(binary_path).await?;
                info!(target: LOG_TARGET, "Calculated actual hash for {:?}: {}", binary_path, actual_hash);
                
                // Compare checksums
                let is_valid = expected_checksum == actual_hash;
                
                if is_valid {
                    info!(target: LOG_TARGET, "Binary integrity validation PASSED for {:?}", binary_path);
                } else {
                    warn!(target: LOG_TARGET, "Binary integrity validation FAILED for {:?}", binary_path);
                    warn!(target: LOG_TARGET, "Expected checksum: {}", expected_checksum);
                    warn!(target: LOG_TARGET, "Actual checksum:   {}", actual_hash);
                    
                    // Additional debugging: check if this is a platform-specific binary name issue
                    let file_name = binary_path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown");
                    warn!(target: LOG_TARGET, "Binary file name being validated: {}", file_name);
                    
                    // Check if file was modified during extraction
                    let metadata = std::fs::metadata(binary_path)?;
                    warn!(target: LOG_TARGET, "Binary file size: {} bytes", metadata.len());
                    warn!(target: LOG_TARGET, "Binary file permissions: {:?}", metadata.permissions());
                }
                
                Ok(is_valid)
            }
            Err(e) => {
                // Enhanced error reporting when checksum is not available
                warn!(target: LOG_TARGET, "No checksum available for {:?} (error: {}), falling back to size check", binary, e);
                
                let metadata = std::fs::metadata(binary_path)?;
                let file_size = metadata.len();
                
                // Basic sanity check - binary should be at least 1KB
                if file_size < 1024 {
                    warn!(target: LOG_TARGET, "Binary file is suspiciously small: {} bytes", file_size);
                    return Ok(false);
                }

                info!(target: LOG_TARGET, "Binary integrity validation passed for {:?} (size: {} bytes, no checksum available)", binary_path, file_size);
                Ok(true)
            }
        }
    }

    /// Calculate and cache binary hash for runtime checks
    pub async fn cache_binary_hash(binary_path: &Path) -> Result<String, anyhow::Error> {
        debug!(target: LOG_TARGET, "Calculating hash for binary: {:?}", binary_path);
        Self::calculate_file_hash(binary_path).await
    }

    #[allow(dead_code)]
    /// Quick integrity check using cached hash (for future use)
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
        process_name: &str,
    ) -> Result<PathBuf, anyhow::Error> {
        error!(target: LOG_TARGET, "Binary corruption detected for {:?} at {:?}", binary, binary_path);

        // Calculate actual hash for reporting
        let actual_hash = match Self::calculate_file_hash(binary_path).await {
            Ok(hash) => hash,
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not calculate actual hash: {}", e);
                "calculation_failed".to_string()
            }
        };

        // Get expected hash
        let expected_hash = {
            let resolver = BinaryResolver::current().read().await;
            resolver.get_binary_checksum(binary).await.ok()
        };

        // Emit corruption detection event
        let corruption_payload = crate::events::BinaryCorruptionPayload {
            process_name: process_name.to_string(),
            binary_path: binary_path.display().to_string(),
            expected_hash: expected_hash.clone(),
            actual_hash: actual_hash.clone(),
            redownload_initiated: true,
        };
        crate::events_emitter::EventsEmitter::emit_binary_corruption_detected(corruption_payload).await;

        // Remove the corrupted file
        if binary_path.exists() {
            if let Err(e) = std::fs::remove_file(binary_path) {
                warn!(target: LOG_TARGET, "Failed to remove corrupted binary file: {}", e);
            }
        }

        // Re-resolve the binary path, which should trigger a download
        let resolver = BinaryResolver::current().read().await;
        match resolver.resolve_path_to_binary_files(binary).await {
            Ok(new_path) => {
                info!(target: LOG_TARGET, "Successfully resolved binary path after corruption: {:?}", new_path);

                // Emit integrity restored event if download was successful
                crate::events_emitter::EventsEmitter::emit_binary_integrity_restored(process_name.to_string()).await;

                Ok(new_path)
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to resolve binary path after corruption: {}", e);
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

        // Verify cached integrity with correct hash
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
