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

pub mod minotari_wallet;
pub mod send_gate;
pub mod wallet_types;

/// Removes the on-disk wallet data for the current network: the in-process minotari DB
/// (`<base>/minotari-wallet/<network>`) and the legacy console wallet folder
/// (`<base>/wallet/<network>`).
pub async fn clean_wallet_data_folders(base_path: &Path) -> Result<(), anyhow::Error> {
    let network_str = Network::get_current().to_string().to_lowercase();
    for dir in [
        base_path.join("minotari-wallet").join(&network_str),
        base_path.join("wallet").join(&network_str),
    ] {
        if dir.try_exists()? && dir.is_dir() {
            tokio::fs::remove_dir_all(&dir).await?;
            info!(target: LOG_TARGET_APP_LOGIC, "Removed wallet data folder {}", dir.display());
        }
    }
    Ok(())
}
