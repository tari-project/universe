use log::{info, warn};
use std::{thread::sleep, time::Duration};

use super::rpc::permission_token;

const LOG_TARGET: &str = "tari::universe::main";

pub async fn try_get_tokens(grpc_port: Option<u16>) -> (String, String) {
    loop {
        match permission_token(grpc_port).await {
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
