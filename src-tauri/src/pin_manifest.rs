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

pub const VERSION_RECORDS: [&str; 3] = [
    include_str!("../binaries-versions/binaries_versions_mainnet.json"),
    include_str!("../binaries-versions/binaries_versions_testnets.json"),
    include_str!("../binaries-versions/binaries_versions_nextnet.json"),
];

#[allow(dead_code)] // Used by build.rs and by the shared integrity tests.
pub fn validate_version_records() -> Result<(), String> {
    for source in VERSION_RECORDS {
        let data: serde_json::Value =
            serde_json::from_str(source).map_err(|error| error.to_string())?;
        for binary in [
            "xmrig",
            "lolminer",
            "minotari_node",
            "mmproxy",
            "wallet",
            "tor",
            "bridge",
            "tariminer",
        ] {
            let pins = &data["hashes"][binary];
            if pins["version"].as_str().is_none() || pins["version"] != data["binaries"][binary] {
                return Err(format!(
                    "Missing or stale {binary} executable hashes; update version and hashes together"
                ));
            }
            let networks: Vec<&serde_json::Value> =
                if matches!(binary, "minotari_node" | "mmproxy" | "wallet") {
                    // This release only publishes mainnet and esme. Other network selections
                    // remain unavailable and fail closed in the runtime pin lookup.
                    vec![
                        &pins["networks"]["mainnet"]["platforms"],
                        &pins["networks"]["esme"]["platforms"],
                    ]
                } else {
                    vec![&pins["platforms"]]
                };
            for platforms in networks {
                let required: &[&str] = if matches!(binary, "lolminer" | "tariminer") {
                    &["linux-x86_64", "windows-x86_64"]
                } else {
                    &[
                        "linux-x86_64",
                        "windows-x86_64",
                        "macos-x86_64",
                        "macos-aarch64",
                    ]
                };
                for platform in required {
                    let files = platforms[*platform]
                        .as_object()
                        .filter(|files| !files.is_empty())
                        .ok_or_else(|| format!("Missing {binary} {platform} executable hashes"))?;
                    for (path, hash) in files {
                        if std::path::Path::new(path)
                            .components()
                            .any(|part| !matches!(part, std::path::Component::Normal(_)))
                        {
                            return Err(format!("Invalid {binary} pin path: {path}"));
                        }
                        if !hash.as_str().is_some_and(|hash| {
                            hash.len() == 64 && hash.bytes().all(|b| b.is_ascii_hexdigit())
                        }) {
                            return Err(format!(
                                "Missing or malformed {binary} {platform} {path} SHA-256"
                            ));
                        }
                    }
                }
            }
        }
    }
    Ok(())
}
