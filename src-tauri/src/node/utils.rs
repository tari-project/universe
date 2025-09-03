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

use minotari_node_grpc_client::grpc::{SyncProgressResponse, SyncState};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub(crate) struct SyncProgressInfo {
    pub progress_params: HashMap<String, String>,
    pub percentage: f64,
}

impl SyncProgressInfo {
    pub fn from_sync_progress(
        sync_progress: &SyncProgressResponse,
        required_sync_peers: u32,
    ) -> Self {
        let mut progress_params = HashMap::new();
        let mut percentage = 0f64;

        match sync_progress.state {
            x if x == SyncState::Startup as i32 => {
                percentage =
                    sync_progress.initial_connected_peers as f64 / f64::from(required_sync_peers);
                progress_params.insert("step".to_string(), "Startup".to_string());
                progress_params.insert(
                    "initial_connected_peers".to_string(),
                    sync_progress.initial_connected_peers.to_string(),
                );
                progress_params.insert(
                    "required_peers".to_string(),
                    required_sync_peers.to_string(),
                );
            }
            x if x == SyncState::Header as i32 => {
                percentage = sync_progress.local_height as f64 / sync_progress.tip_height as f64;
                progress_params.insert("step".to_string(), "Header".to_string());
                progress_params.insert(
                    "local_header_height".to_string(),
                    sync_progress.local_height.to_string(),
                );
                progress_params.insert(
                    "tip_header_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
                progress_params.insert("local_block_height".to_string(), "0".to_string());
                progress_params.insert(
                    "tip_block_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
                // Keep these fields for old translations that have not been updated
                progress_params.insert(
                    "local_height".to_string(),
                    sync_progress.local_height.to_string(),
                );
                progress_params.insert(
                    "tip_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
            }
            x if x == SyncState::Block as i32 => {
                percentage = sync_progress.local_height as f64 / sync_progress.tip_height as f64;
                progress_params.insert("step".to_string(), "Block".to_string());
                progress_params.insert(
                    "local_header_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
                progress_params.insert(
                    "tip_header_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
                progress_params.insert(
                    "local_block_height".to_string(),
                    sync_progress.local_height.to_string(),
                );
                progress_params.insert(
                    "tip_block_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
                // Keep these fields for old translations that have not been updated
                progress_params.insert(
                    "local_height".to_string(),
                    sync_progress.local_height.to_string(),
                );
                progress_params.insert(
                    "tip_height".to_string(),
                    sync_progress.tip_height.to_string(),
                );
            }
            x if x == SyncState::Done as i32 => {
                progress_params.insert("step".to_string(), "Done".to_string());
            }
            _ => {}
        }

        Self {
            progress_params,
            percentage,
        }
    }
}
