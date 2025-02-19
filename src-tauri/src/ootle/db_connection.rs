use log::{error, info, warn};
use std::{thread::sleep, time::Duration};

use super::rpc::permission_token;

const LOG_TARGET: &str = "tari::universe::main";

pub async fn try_get_tokens(jrpc_port: Option<u16>) -> (String, String) {
    let close_max_retries: u32 = 10; // Maximum number of retries
    let retry_delay_ms: u64 = 10000; // Delay between retries in milliseconds

    let mut retries = 0;
    loop {
        match permission_token(jrpc_port).await {
            Ok(tokens) => {
                info!(target: LOG_TARGET, "✅ Wallet Daemon permission token found");
                return tokens;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "❌ Wallet Daemon permission token error: {:?}", e);
                retries += 1;
                if retries >= close_max_retries {
                    error!(target: LOG_TARGET, "Failed to fetch permission token after {:?} retries: {:?}", close_max_retries,e);
                    return ("".to_string(), "".to_string());
                }
                sleep(Duration::from_millis(retry_delay_ms));
                continue;
            }
        }
    }
}
