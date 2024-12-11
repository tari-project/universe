use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    thread::sleep,
    time::Duration,
};

use diesel::SqliteConnection;
use log::{info, warn};
use tokio_util::sync::CancellationToken;

use super::rpc::permission_token;

#[derive(Default)]
pub struct ShutdownTokens(pub Arc<tokio::sync::Mutex<HashMap<i32, CancellationToken>>>);
pub struct DatabaseConnection(pub Arc<Mutex<SqliteConnection>>);
pub struct AssetServer {
    pub addr: String,
    pub cancel_token: CancellationToken,
}

const LOG_TARGET: &str = "tari::universe::main";

async fn try_get_tokens() -> (String, String) {
    loop {
        match permission_token().await {
            Ok(tokens) => {
                info!(target: LOG_TARGET, "✅ Wallet Daemon permission token found");
                return tokens;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "❌ Wallet Daemon permission token error: {:?}", e);
                sleep(Duration::from_millis(500));
                continue;
            }
        }
    }
}
