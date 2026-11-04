// Copyright 2025. The Tari Project
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

use std::path::Path;

use log::info;
use tari_common::configuration::Network;

use crate::LOG_TARGET_APP_LOGIC;
use crate::wallet::minotari_wallet::database_manager::MinotariWalletDatabaseManager;

pub mod minotari_wallet;
pub mod send_gate;
pub mod wallet_types;

/// Removes the on-disk wallet data for the current network: the in-process minotari DB
/// (wherever `MinotariWalletDatabaseManager` actually put it) and the legacy console
/// wallet folder (`<base>/wallet/<network>`).
pub async fn clean_wallet_data_folders(base_path: &Path) -> Result<(), anyhow::Error> {
    let network_str = Network::get_current().to_string().to_lowercase();
    for dir in [
        MinotariWalletDatabaseManager::minotari_wallet_dir()?,
        base_path.join("wallet").join(&network_str),
    ] {
        if dir.try_exists()? && dir.is_dir() {
            tokio::fs::remove_dir_all(&dir).await?;
            info!(target: LOG_TARGET_APP_LOGIC, "Removed wallet data folder {}", dir.display());
        }
    }
    Ok(())
}

#[cfg(test)]
mod log_redaction_tests {
    use std::path::Path;

    const SCANNED_DIRS: [&str; 3] = ["src/wallet", "src/mcp/tools", "src/ootle"];
    const FORBIDDEN: [&str; 5] = [
        "{amount",
        "{destination",
        "{payment_id",
        "{claim",
        "{commitment",
    ];

    fn rust_files(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
        for entry in std::fs::read_dir(dir).expect("read source dir") {
            let path = entry.expect("dir entry").path();
            if path.is_dir() {
                rust_files(&path, out);
                continue;
            }
            if path.extension().is_some_and(|ext| ext == "rs") {
                out.push(path);
            }
        }
    }

    /// App logs ship in support bundles, so send/burn/claim log lines must not
    /// interpolate amounts, addresses, payment IDs, claim keys or commitments.
    // ponytail: catches inline `{name}` captures only, not positional `"{}", name` args.
    #[test]
    fn send_paths_do_not_log_transaction_details() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"));
        let mut files = Vec::new();
        for dir in SCANNED_DIRS {
            rust_files(&root.join(dir), &mut files);
        }
        let mut leaks = Vec::new();
        for file in files {
            let source = std::fs::read_to_string(&file).expect("read source file");
            for mac in ["info!(", "debug!(", "warn!("] {
                for (start, _) in source.match_indices(mac) {
                    let rest = &source[start..];
                    let call = &rest[..rest.find(");").unwrap_or(rest.len())];
                    for field in FORBIDDEN.iter().filter(|field| call.contains(**field)) {
                        let line = source[..start].matches('\n').count() + 1;
                        leaks.push(format!("{}:{line} logs {field}", file.display()));
                    }
                }
            }
        }
        assert!(
            leaks.is_empty(),
            "transaction details in logs:\n{}",
            leaks.join("\n")
        );
    }
}
