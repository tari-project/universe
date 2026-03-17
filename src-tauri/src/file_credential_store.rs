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
use std::path::PathBuf;
use std::sync::OnceLock;

static STORE_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Set the directory where credential files are stored.
/// Must be called before any keyring operations.
pub fn set_store_dir(dir: PathBuf) {
    let _ = STORE_DIR.set(dir);
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
        let filename = format!("{}_{}.bin", service, user);
        let safe_filename = filename.replace(['/', '\\', ':'], "_");
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
        fs::write(&self.path, secret).map_err(|e| Error::PlatformFailure(Box::new(e)))?;
        Ok(())
    }

    fn get_password(&self) -> Result<String> {
        let bytes = self.get_secret()?;
        String::from_utf8(bytes).map_err(|e| Error::PlatformFailure(Box::new(e)))
    }

    fn get_secret(&self) -> Result<Vec<u8>> {
        if !self.path.exists() {
            return Err(Error::NoEntry);
        }
        fs::read(&self.path).map_err(|e| Error::PlatformFailure(Box::new(e)))
    }

    fn delete_credential(&self) -> Result<()> {
        if !self.path.exists() {
            return Err(Error::NoEntry);
        }
        fs::remove_file(&self.path).map_err(|e| Error::PlatformFailure(Box::new(e)))
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
