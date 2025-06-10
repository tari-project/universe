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

use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};

use crate::{
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::airdrop";

#[derive(Debug, Deserialize, Serialize)]
pub struct AirdropAccessToken {
    pub exp: u64,
    pub iat: i32,
    pub id: String,
    pub provider: String,
    pub role: String,
    pub scope: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AirdropMinedBlockMessage {
    pub wallet_view_key_hashed: String,
    pub app_id: String,
    pub block_height: u64,
}

pub fn decode_jwt_claims(t: &str) -> Option<AirdropAccessToken> {
    let key = DecodingKey::from_secret(&[]);
    let mut validation = Validation::new(Algorithm::HS256);
    validation.insecure_disable_signature_validation();

    match decode::<AirdropAccessToken>(t, &key, &validation) {
        Ok(data) => Some(data.claims),
        Err(e) => {
            warn!(target: LOG_TARGET,"Error decoding access token: {:?}", e);
            None
        }
    }
}

pub fn decode_jwt_claims_without_exp(t: &str) -> Option<AirdropAccessToken> {
    let key = DecodingKey::from_secret(&[]);
    let mut validation = Validation::new(Algorithm::HS256);
    validation.insecure_disable_signature_validation();
    validation.validate_exp = false;

    match decode::<AirdropAccessToken>(t, &key, &validation) {
        Ok(data) => Some(data.claims),
        Err(e) => {
            warn!(target: LOG_TARGET,"Error decoding access token without exp: {:?}", e);
            None
        }
    }
}

pub async fn validate_jwt(airdrop_access_token: Option<String>) -> Option<String> {
    airdrop_access_token.and_then(|t| {
        let claims = decode_jwt_claims(&t);

        let now = std::time::SystemTime::now();
        let now_unix = now
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        if let Some(claims) = claims {
            if claims.exp < now_unix {
                warn!(target: LOG_TARGET,"Access token has expired");
                None
            } else {
                Some(t)
            }
        } else {
            None
        }
    })
}

pub async fn get_wallet_view_key_hashed(app: AppHandle) -> String {
    let wallet_manager = app.state::<UniverseAppState>().wallet_manager.clone();
    let view_private_key = wallet_manager.get_view_private_key().await;
    hex::encode(Sha256::digest(view_private_key))
}

pub async fn send_new_block_mined(app: AppHandle, block_height: u64) {
    TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
        let app_in_config_memory = app.state::<UniverseAppState>().in_memory_config.clone();
        let config = ConfigCore::content().await;
        let app_id = config.anon_id().to_string();

        let hashed_view_private_key = get_wallet_view_key_hashed(app.clone()).await;

        let client = reqwest::Client::new();
        let base_url = app_in_config_memory.read().await.airdrop_api_url.clone();
        let url = format!("{}/miner/mined-block", base_url);
        let message = AirdropMinedBlockMessage {
            wallet_view_key_hashed: hashed_view_private_key,
            app_id,
            block_height
        };
        if let Ok(response) = client
            .post(url)
            .json(&message)
            .send()
            .await
            .inspect_err(|e| {
                error!(target: LOG_TARGET,"error at sending newly mined block to /miner/mined-block {}", e.to_string());
            })
        {
            let status = response.status();
            if status.is_success() {
                info!(target:LOG_TARGET," successfully sent newly mined block data to /miner/mined-block");
            } else {
                error!(target:LOG_TARGET,"error at sending to /miner/mined-block {:?}",response.text().await);
            }
        }
    });
}
