// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

use std::{
    fs,
    path::{Path, PathBuf},
};
use log::{info, warn};

/// Cleans up old binary files after a successful update,
/// keeping only the currently active binary version.
///
/// This prevents long-running installations from accumulating
/// gigabytes of outdated binary files.
pub fn cleanup_old_binaries(
    binary_dir: &Path,
    current_version: &str,
    binary_prefix: &str,
) -> std::io::Result<usize> {
    let mut removed = 0;

    let entries = match fs::read_dir(binary_dir) {
        Ok(e) => e,
        Err(err) => {
            warn!("Could not read binary directory {:?}: {}", binary_dir, err);
            return Ok(0);
        },
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let fname = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n,
            None => continue,
        };
        // Only touch files matching our binary prefix
        if !fname.starts_with(binary_prefix) {
            continue;
        }
        // Keep the current version — use exact segment match to prevent
        // substring false positives (e.g. "1.6.1" matching "1.6.10").
        // After stripping the prefix, the remaining string must either
        // equal the version exactly or start with version + a non-digit
        // separator (like "-" or ".ext").
        let after_prefix = &fname[binary_prefix.len()..];
        let is_current = after_prefix == current_version
            || after_prefix.starts_with(&format!("{}-", current_version))
            || after_prefix.starts_with(&format!("{}.", current_version));
        if is_current {
            info!("Keeping current binary: {:?}", path);
            continue;
        }
        // Remove old version
        match fs::remove_file(&path) {
            Ok(_) => {
                info!("Removed old binary: {:?}", path);
                removed += 1;
            },
            Err(err) => {
                warn!("Failed to remove old binary {:?}: {}", path, err);
            },
        }
    }

    info!("Binary cleanup complete: {} file(s) removed", removed);
    Ok(removed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn make_file(dir: &Path, name: &str) {
        fs::write(dir.join(name), b"fake binary").unwrap();
    }

    #[test]
    fn removes_old_versions_keeps_current() {
        let dir = tempdir().unwrap();
        make_file(dir.path(), "tari-universe-1.5.0");
        make_file(dir.path(), "tari-universe-1.6.0");
        make_file(dir.path(), "tari-universe-1.6.11"); // current
        make_file(dir.path(), "other-binary-1.0.0");   // unrelated

        let removed = cleanup_old_binaries(
            dir.path(), "1.6.11", "tari-universe-"
        ).unwrap();

        assert_eq!(removed, 2, "Should remove 2 old tari-universe binaries");
        assert!(dir.path().join("tari-universe-1.6.11").exists(),
            "Current version must be kept");
        assert!(!dir.path().join("tari-universe-1.5.0").exists(),
            "Old version 1.5.0 should be removed");
        assert!(!dir.path().join("tari-universe-1.6.0").exists(),
            "Old version 1.6.0 should be removed");
        assert!(dir.path().join("other-binary-1.0.0").exists(),
            "Unrelated binaries must not be touched");
    }

    #[test]
    fn returns_zero_when_nothing_to_clean() {
        let dir = tempdir().unwrap();
        make_file(dir.path(), "tari-universe-1.6.11");
        let removed = cleanup_old_binaries(
            dir.path(), "1.6.11", "tari-universe-"
        ).unwrap();
        assert_eq!(removed, 0);
    }

    #[test]
    fn handles_empty_directory() {
        let dir = tempdir().unwrap();
        let removed = cleanup_old_binaries(
            dir.path(), "1.6.11", "tari-universe-"
        ).unwrap();
        assert_eq!(removed, 0);
    }

    #[test]
    fn substring_version_not_falsely_kept() {
        // Regression: "1.6.1" must NOT protect "tari-universe-1.6.10" or "1.6.11"
        let dir = tempdir().unwrap();
        make_file(dir.path(), "tari-universe-1.6.1");   // current
        make_file(dir.path(), "tari-universe-1.6.10");  // old — must be removed
        make_file(dir.path(), "tari-universe-1.6.11");  // old — must be removed

        let removed = cleanup_old_binaries(
            dir.path(), "1.6.1", "tari-universe-"
        ).unwrap();

        assert_eq!(removed, 2, "Only exact version match should be kept");
        assert!(dir.path().join("tari-universe-1.6.1").exists(),
            "Current 1.6.1 must be kept");
        assert!(!dir.path().join("tari-universe-1.6.10").exists(),
            "1.6.10 must be removed — not a substring match of 1.6.1");
        assert!(!dir.path().join("tari-universe-1.6.11").exists(),
            "1.6.11 must be removed — not a substring match of 1.6.1");
    }
}
