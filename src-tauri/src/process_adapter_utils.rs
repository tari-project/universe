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

use anyhow::Error;
use log::{info, warn};
use std::fs;
use std::path::{Path, PathBuf};
use tari_common::configuration::Network;

const LOG_TARGET: &str = "tari::universe::process_adapter_utils";

/// Setup common directory structure and cleanup
pub fn setup_working_directory(data_dir: &Path, working_dir_name: &str) -> Result<PathBuf, Error> {
    let working_dir = data_dir.join(working_dir_name);
    let network_dir = working_dir.join(Network::get_current().to_string().to_lowercase());
    std::fs::create_dir_all(&working_dir)?;

    // Remove peerdb on every restart as requested by Protocol team
    let peer_db_dir = network_dir.join("peer_db");
    if peer_db_dir.exists() {
        info!(target: LOG_TARGET, "Removing peer db at {peer_db_dir:?}");
        let _unused = fs::remove_dir_all(peer_db_dir).inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to remove peer db: {e:?}");
        });
    }

    Ok(working_dir)
}
