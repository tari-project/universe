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
use log::{info, warn};
use serde::{Deserialize, Serialize};

use crate::{mm_proxy_adapter::MergeMiningProxyConfig, UniverseAppState};

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

pub async fn restart_mm_proxy_with_new_telemetry_id(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    info!(target: LOG_TARGET, "Restarting mm_proxy");
    let telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    let mm_proxy_manager_config = state
        .mm_proxy_manager
        .config()
        .await
        .ok_or("mm proxy config could not be found")?;
    let _unused = state
        .mm_proxy_manager
        .change_config(MergeMiningProxyConfig {
            coinbase_extra: telemetry_id.clone(),
            ..mm_proxy_manager_config
        })
        .await
        .map_err(|e| e.to_string());
    info!(target: LOG_TARGET, "mm_proxy restarted");
    Ok(())
}
