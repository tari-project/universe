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

// File-backed credential store for test-mode only.
// Stores credentials as files on disk so wallet state persists across
// binary restarts during Playwright tests. NOT for production use.

#![cfg(feature = "test-mode")]

use keyring::Error;
use keyring::credential::{
    Credential, CredentialApi, CredentialBuilder, CredentialBuilderApi, CredentialPersistence,
};
use keyring::error::Result;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::OnceLock;

static STORE_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Set the directory where credential files are stored.
/// Must be called before any keyring operations.
pub fn set_store_dir(dir: PathBuf) {
    drop(STORE_DIR.set(dir));
}

fn store_dir() -> &'static PathBuf {
    STORE_DIR
        .get()
        .expect("file_credential_store::set_store_dir must be called before use")
}

/// A credential backed by a file on disk.
#[derive(Debug)]
struct FileCredential {
    path: PathBuf,
}

impl FileCredential {
    fn new(_target: Option<&str>, service: &str, user: &str) -> Result<Self> {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(format!("{service}_{user}").as_bytes());
        let hash = hasher.finalize();
        // Use first 16 bytes (32 hex chars) for a short but unique filename
        let safe_filename = format!("{}.bin", hex::encode(&hash[..16]));
        Ok(Self {
            path: store_dir().join(safe_filename),
        })
    }
}

impl CredentialApi for FileCredential {
    fn set_password(&self, password: &str) -> Result<()> {
        self.set_secret(password.as_bytes())
    }

    fn set_secret(&self, secret: &[u8]) -> Result<()> {
        fs::create_dir_all(store_dir()).map_err(|e| Error::PlatformFailure(Box::new(e)))?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            let mut file = fs::OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .mode(0o600)
                .open(&self.path)
                .map_err(|e| Error::PlatformFailure(Box::new(e)))?;
            file.write_all(secret)
                .map_err(|e| Error::PlatformFailure(Box::new(e)))?;
        }
        #[cfg(not(unix))]
        {
            fs::write(&self.path, secret).map_err(|e| Error::PlatformFailure(Box::new(e)))?;
        }
        Ok(())
    }

    fn get_password(&self) -> Result<String> {
        let bytes = self.get_secret()?;
        String::from_utf8(bytes).map_err(|e| Error::PlatformFailure(Box::new(e)))
    }

    fn get_secret(&self) -> Result<Vec<u8>> {
        match fs::read(&self.path) {
            Ok(v) => Ok(v),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err(Error::NoEntry),
            Err(e) => Err(Error::PlatformFailure(Box::new(e))),
        }
    }

    fn delete_credential(&self) -> Result<()> {
        match fs::remove_file(&self.path) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err(Error::NoEntry),
            Err(e) => Err(Error::PlatformFailure(Box::new(e))),
        }
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn debug_fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "FileCredential({:?})", self.path)
    }
}

struct FileCredentialBuilder;

impl CredentialBuilderApi for FileCredentialBuilder {
    fn build(&self, target: Option<&str>, service: &str, user: &str) -> Result<Box<Credential>> {
        let cred = FileCredential::new(target, service, user)?;
        Ok(Box::new(cred))
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn persistence(&self) -> CredentialPersistence {
        CredentialPersistence::UntilDelete
    }
}

/// Returns a file-backed credential builder for use in test-mode.
pub fn default_credential_builder() -> Box<CredentialBuilder> {
    Box::new(FileCredentialBuilder)
}
