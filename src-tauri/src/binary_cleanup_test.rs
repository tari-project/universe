// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

#[cfg(test)]
mod binary_cleanup_tests {
    use super::super::binary_cleanup::cleanup_old_binaries;
    use std::fs;
    use tempfile::tempdir;

    fn touch(dir: &std::path::Path, name: &str) {
        fs::write(dir.join(name), b"fake binary content").unwrap();
    }

    #[test]
    fn removes_old_keeps_current() {
        let dir = tempdir().unwrap();
        touch(dir.path(), "tari-universe-1.5.0");
        touch(dir.path(), "tari-universe-1.6.0");
        touch(dir.path(), "tari-universe-1.6.11"); // current
        let removed = cleanup_old_binaries(dir.path(), "1.6.11", "tari-universe-").unwrap();
        assert_eq!(removed, 2, "Should remove exactly 2 old binaries");
        assert!(dir.path().join("tari-universe-1.6.11").exists(), "Current must be kept");
        assert!(!dir.path().join("tari-universe-1.5.0").exists());
        assert!(!dir.path().join("tari-universe-1.6.0").exists());
    }

    #[test]
    fn unrelated_binaries_untouched() {
        let dir = tempdir().unwrap();
        touch(dir.path(), "tari-universe-1.5.0");
        touch(dir.path(), "tari-universe-1.6.11");
        touch(dir.path(), "minotari-node-1.0.0");  // different prefix
        touch(dir.path(), "xmrig-6.21.0");          // completely unrelated
        let removed = cleanup_old_binaries(dir.path(), "1.6.11", "tari-universe-").unwrap();
        assert_eq!(removed, 1);
        assert!(dir.path().join("minotari-node-1.0.0").exists(), "Other binaries untouched");
        assert!(dir.path().join("xmrig-6.21.0").exists(), "xmrig untouched");
    }

    #[test]
    fn empty_dir_returns_zero() {
        let dir = tempdir().unwrap();
        let removed = cleanup_old_binaries(dir.path(), "1.6.11", "tari-universe-").unwrap();
        assert_eq!(removed, 0);
    }

    #[test]
    fn only_current_returns_zero() {
        let dir = tempdir().unwrap();
        touch(dir.path(), "tari-universe-1.6.11");
        let removed = cleanup_old_binaries(dir.path(), "1.6.11", "tari-universe-").unwrap();
        assert_eq!(removed, 0, "Current-only dir should remove nothing");
    }

    #[test]
    fn handles_nonexistent_dir_gracefully() {
        let path = std::path::Path::new("/nonexistent/path/that/does/not/exist");
        let result = cleanup_old_binaries(path, "1.6.11", "tari-universe-");
        assert!(result.is_ok(), "Non-existent dir returns Ok(0), not Err");
        assert_eq!(result.unwrap(), 0);
    }
}
