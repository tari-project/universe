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

use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{self, Read},
    path::{Component, Path},
};

#[path = "pin_manifest.rs"]
mod pin_manifest;
use pin_manifest::VERSION_RECORDS;

fn invalid(message: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::PermissionDenied, message.into())
}

pub fn platform_key() -> io::Result<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("linux", "x86_64") => Ok("linux-x86_64"),
        ("windows", "x86_64") => Ok("windows-x86_64"),
        ("macos", "x86_64") => Ok("macos-x86_64"),
        ("macos", "aarch64") => Ok("macos-aarch64"),
        _ => Err(invalid("No executable pins for this platform")),
    }
}

pub fn file_digest(path: &Path) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 65536];
    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        digest.update(&buffer[..count]);
    }
    Ok(format!("{:x}", digest.finalize()))
}

pub fn verify_file(path: &Path, expected: &str) -> io::Result<()> {
    if expected.len() != 64 || !expected.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(invalid(format!(
            "Missing or malformed SHA-256 pin for {}; reinstall or update Universe",
            path.display()
        )));
    }
    if !file_digest(path)?.eq_ignore_ascii_case(expected) {
        return Err(invalid(format!(
            "SHA-256 verification failed for {}; remove this binary cache and reinstall using Universe",
            path.display()
        )));
    }
    Ok(())
}

fn expected_hash<'a>(
    data: &'a serde_json::Value,
    binary: &str,
    version: &str,
    platform: &str,
    network: &str,
    relative: &str,
) -> io::Result<&'a str> {
    let pins = &data["hashes"][binary];
    let selected = data["binaries"][binary]
        .as_str()
        .ok_or_else(|| invalid("Missing binary version"))?;
    if pins["version"].as_str() != Some(selected)
        || selected.split('|').next().map(str::trim) != Some(version)
    {
        return Err(invalid(format!(
            "Missing or stale {binary} {version} SHA-256 pins; update Universe"
        )));
    }
    let platforms = if pins.get("networks").is_some() {
        &pins["networks"][network]["platforms"]
    } else {
        &pins["platforms"]
    };
    platforms[platform][relative].as_str().filter(|hash|hash.len()==64 && hash.bytes().all(|b|b.is_ascii_hexdigit())).ok_or_else(||invalid(format!("Missing SHA-256 pin for {binary} {version} {platform} {network} {relative}; update Universe")))
}

fn record_for_network(network: &str) -> io::Result<(serde_json::Value, &'static str)> {
    let (record, artifact_network) = match network {
        "mainnet" => (0, "mainnet"),
        "stagenet" => (0, "nextnet"),
        "nextnet" => (2, "nextnet"),
        "esmeralda" | "localnet" => (1, "esme"),
        "igor" => (1, "testnet"),
        _ => return Err(invalid("Unknown executable network")),
    };
    Ok((
        serde_json::from_str(VERSION_RECORDS[record]).map_err(invalid_json)?,
        artifact_network,
    ))
}
fn invalid_json(error: serde_json::Error) -> io::Error {
    invalid(error.to_string())
}

/// Verify the actual child, including restart and device detection paths.
pub fn verify_launch_path(path: &Path, selected_network: &str) -> io::Result<()> {
    let parts: Vec<_> = path.components().collect();
    let index = parts
        .iter()
        .rposition(|part| part.as_os_str() == "binaries")
        .ok_or_else(|| {
            invalid(format!(
                "Executable is outside the managed binary cache: {}",
                path.display()
            ))
        })?;
    let text = |index: usize| {
        parts
            .get(index)
            .and_then(|part| part.as_os_str().to_str())
            .ok_or_else(|| invalid("Invalid executable cache path"))
    };
    let repo = text(index + 1)?;
    let network = text(index + 2)?;
    if network != selected_network {
        return Err(invalid(
            "Executable cache network does not match the selected network; resolve the binary again",
        ));
    }
    let version = text(index + 3)?;
    let relative: std::path::PathBuf = parts[index + 4..].iter().collect();
    let relative = relative
        .to_str()
        .ok_or_else(|| invalid("Invalid executable filename"))?
        .replace('\\', "/");
    let binary = match repo {
        "xmrig" => "xmrig",
        "lolMiner-releases" => "lolminer",
        "TARI.Miner" => "tariminer",
        "tor-binaries" => "tor",
        "tari" => match path.file_stem().and_then(|name| name.to_str()) {
            Some("minotari_node") => "minotari_node",
            Some("minotari_merge_mining_proxy") => "mmproxy",
            _ => return Err(invalid("Unknown Tari suite executable")),
        },
        _ => return Err(invalid("Unknown executable repository")),
    };
    let (data, artifact_network) = record_for_network(network)?;
    let hash = expected_hash(
        &data,
        binary,
        version,
        platform_key()?,
        artifact_network,
        &relative,
    )?;
    // A same-user process can still replace the path after this check and before spawn.
    // Upstream issue #3471 tracks this remaining check-to-launch race.
    verify_file(path, hash)?;
    // These archives also carry runtime libraries, drivers, transports, and solver binaries.
    // Verify those pinned executable files whenever the selected executable is launched.
    if matches!(binary, "tor" | "xmrig" | "tariminer") {
        let root: std::path::PathBuf = parts[..index + 4].iter().collect();
        let files = data["hashes"][binary]["platforms"][platform_key()?]
            .as_object()
            .ok_or_else(|| invalid("Missing executable artifact pins"))?;
        for relative in files.keys() {
            let expected = expected_hash(
                &data,
                binary,
                version,
                platform_key()?,
                artifact_network,
                relative,
            )?;
            verify_file(&root.join(relative), expected)?;
        }
    }
    Ok(())
}

#[allow(dead_code)] // Shared with process-wrapper, which only launches native executables.
fn load_pinned_content(
    root: &Path,
    data: &serde_json::Value,
    binary: &str,
    version: &str,
    platform: &str,
    network: &str,
    relative: &str,
) -> io::Result<Vec<u8>> {
    if Path::new(relative)
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err(invalid("Invalid executable content path"));
    }
    let expected = expected_hash(data, binary, version, platform, network, relative)?;
    let bytes = std::fs::read(root.join(relative))?;
    if format!("{:x}", Sha256::digest(&bytes)) != expected.to_ascii_lowercase() {
        return Err(invalid(
            "Bridge content SHA-256 mismatch; remove cached tapplet and reinstall using Universe",
        ));
    }
    Ok(bytes)
}

#[allow(dead_code)] // Shared with process-wrapper, which only launches native executables.
pub fn load_bridge_content(root: &Path, relative: &str) -> io::Result<Vec<u8>> {
    let version = root
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| invalid("Invalid bridge version path"))?;
    let network = root
        .parent()
        .and_then(Path::file_name)
        .and_then(|s| s.to_str())
        .ok_or_else(|| invalid("Missing bridge network"))?;
    let (data, artifact_network) = record_for_network(network)?;
    load_pinned_content(
        root,
        &data,
        "bridge",
        version,
        platform_key()?,
        artifact_network,
        relative,
    )
}

#[allow(dead_code)] // Shared with process-wrapper, which only launches native executables.
pub fn verify_bridge_directory(root: &Path) -> io::Result<()> {
    let version = root
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| invalid("Invalid bridge version path"))?;
    let network = root
        .parent()
        .and_then(Path::file_name)
        .and_then(|s| s.to_str())
        .ok_or_else(|| invalid("Missing bridge network"))?;
    let (data, artifact_network) = record_for_network(network)?;
    let files = data["hashes"]["bridge"]["platforms"][platform_key()?]
        .as_object()
        .ok_or_else(|| invalid("Missing bridge executable content pins"))?;
    if files.is_empty() {
        return Err(invalid("Empty bridge executable content pins"));
    }
    for relative in files.keys() {
        if Path::new(relative)
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
        {
            return Err(invalid("Invalid bridge pin path"));
        }
        let hash = expected_hash(
            &data,
            "bridge",
            version,
            platform_key()?,
            artifact_network,
            relative,
        )?;
        verify_file(&root.join(relative), hash)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const HASH: &str = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    fn record() -> serde_json::Value {
        json!({"binaries":{"xmrig":"1.0"},"hashes":{"xmrig":{"version":"1.0","platforms":{"linux-x86_64":{"xmrig-1.0/xmrig":HASH}}}}})
    }
    #[test]
    fn test_expected_hash_exact_selection_accepts_pinned_fixture() {
        assert_eq!(
            expected_hash(
                &record(),
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "xmrig-1.0/xmrig"
            )
            .expect("valid integrity test fixture"),
            HASH
        );
    }
    #[test]
    fn test_expected_hash_missing_pin_rejects() {
        let mut data = record();
        data["hashes"] = json!({});
        assert!(
            expected_hash(
                &data,
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "xmrig-1.0/xmrig"
            )
            .is_err()
        );
    }
    #[test]
    fn test_expected_hash_wrong_platform_or_version_rejects() {
        for (version, platform) in [("2.0", "linux-x86_64"), ("1.0", "windows-x86_64")] {
            assert!(
                expected_hash(
                    &record(),
                    "xmrig",
                    version,
                    platform,
                    "mainnet",
                    "xmrig-1.0/xmrig"
                )
                .is_err()
            );
        }
    }
    #[test]
    fn test_verify_file_changed_bytes_rejects() {
        let fixture = tempfile::NamedTempFile::new().expect("valid integrity test fixture");
        std::fs::write(fixture.path(), b"abc").expect("valid integrity test fixture");
        verify_file(fixture.path(), HASH).expect("valid integrity test fixture");
        std::fs::write(fixture.path(), b"abd").expect("valid integrity test fixture");
        assert!(verify_file(fixture.path(), HASH).is_err());
        assert!(verify_file(fixture.path(), "").is_err());
    }
    #[test]
    fn test_load_pinned_content_unlisted_or_changed_file_rejects() {
        let root = tempfile::tempdir().expect("valid integrity test fixture");
        let path = root.path().join("xmrig-1.0");
        std::fs::create_dir(&path).expect("valid integrity test fixture");
        std::fs::write(path.join("xmrig"), b"abc").expect("valid integrity test fixture");
        assert_eq!(
            load_pinned_content(
                root.path(),
                &record(),
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "xmrig-1.0/xmrig"
            )
            .expect("valid integrity test fixture"),
            b"abc"
        );
        std::fs::write(path.join("xmrig"), b"abd").expect("valid integrity test fixture");
        assert!(
            load_pinned_content(
                root.path(),
                &record(),
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "xmrig-1.0/xmrig"
            )
            .is_err()
        );
        assert!(
            load_pinned_content(
                root.path(),
                &record(),
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "xmrig-1.0/unlisted.js"
            )
            .is_err()
        );
        assert!(
            load_pinned_content(
                root.path(),
                &record(),
                "xmrig",
                "1.0",
                "linux-x86_64",
                "mainnet",
                "../xmrig-1.0/xmrig"
            )
            .is_err()
        );
    }

    #[test]
    fn test_launch_wrong_network_rejected_before_reading_bytes() {
        let error = verify_launch_path(
            Path::new("/cache/binaries/xmrig/esmeralda/6.26.0/xmrig-6.26.0/xmrig"),
            "mainnet",
        )
        .expect_err("wrong selected network must reject");
        assert!(error.to_string().contains("network"));
    }

    #[test]
    fn test_launch_cache_below_another_binaries_directory() {
        let root = tempfile::tempdir().expect("create cache fixture");
        let path = root
            .path()
            .join("binaries/user/cache/binaries/xmrig/mainnet/6.26.0/xmrig-6.26.0")
            .join(if cfg!(windows) { "xmrig.exe" } else { "xmrig" });
        let error = verify_launch_path(&path, "mainnet").expect_err("fixture file is absent");
        assert_eq!(error.kind(), io::ErrorKind::NotFound);
    }

    #[test]
    fn test_version_records_current_versions_require_matching_pins() {
        pin_manifest::validate_version_records().expect("valid integrity test fixture");
    }
}
