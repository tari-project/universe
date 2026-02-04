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

//! Test utilities for creating isolated test environments.

use std::path::PathBuf;
use tempfile::TempDir;

/// A test context that provides an isolated temporary directory for each test.
///
/// Use this to avoid tests interfering with each other through shared file paths.
pub struct TestContext {
    /// The temporary directory that will be cleaned up when the context is dropped
    pub temp_dir: TempDir,
    /// Path to use for config files
    pub config_dir: PathBuf,
    /// Path to use for data files
    pub data_dir: PathBuf,
    /// Path to use for log files
    pub log_dir: PathBuf,
}

impl TestContext {
    /// Create a new isolated test context with temporary directories.
    pub fn new() -> Self {
        let temp_dir = TempDir::new().expect("Failed to create temp directory for test");
        let base = temp_dir.path();

        let config_dir = base.join("config");
        let data_dir = base.join("data");
        let log_dir = base.join("logs");

        std::fs::create_dir_all(&config_dir).expect("Failed to create config dir");
        std::fs::create_dir_all(&data_dir).expect("Failed to create data dir");
        std::fs::create_dir_all(&log_dir).expect("Failed to create log dir");

        Self {
            temp_dir,
            config_dir,
            data_dir,
            log_dir,
        }
    }

    /// Get the root path of the temporary directory
    pub fn root(&self) -> &std::path::Path {
        self.temp_dir.path()
    }
}

impl Default for TestContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper to create a mock shutdown signal for testing
pub fn create_test_shutdown() -> tari_shutdown::Shutdown {
    tari_shutdown::Shutdown::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_creates_directories() {
        let ctx = TestContext::new();
        assert!(ctx.config_dir.exists());
        assert!(ctx.data_dir.exists());
        assert!(ctx.log_dir.exists());
    }
}
