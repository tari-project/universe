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
