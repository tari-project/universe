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

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::{
    commands::{sign_ws_data, SignWsDataResponse},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    websocket_manager::WebsocketMessage,
};

const LOG_TARGET: &str = "tari::universe::airdrop_claim";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OtpRequest {
    pub csrf_token: String,
    pub app_id: String,
    pub wallet_address: String,
    pub timestamp: u64,
    pub nonce: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OtpRequestMessage {
    #[serde(flatten)]
    pub request: OtpRequest,
    pub signature: String,
    pub pub_key: String,
}

impl OtpRequest {
    pub fn new(csrf_token: String, wallet_address: String) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        let nonce = format!("{}-{}", timestamp, uuid::Uuid::new_v4());
        
        let app_id = ConfigCore::content().await.anon_id().clone();

        Self {
            csrf_token,
            app_id,
            wallet_address,
            timestamp,
            nonce,
        }
    }

    pub fn to_sign_string(&self) -> String {
        format!(
            "{},{},{},{},{}",
            self.csrf_token, self.app_id, self.wallet_address, self.timestamp, self.nonce
        )
    }

    pub async fn sign(&self) -> Result<OtpRequestMessage, String> {
        let message_to_sign = self.to_sign_string();
        
        match sign_ws_data(message_to_sign).await {
            Ok(SignWsDataResponse { signature, pub_key }) => {
                Ok(OtpRequestMessage {
                    request: self.clone(),
                    signature,
                    pub_key,
                })
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to sign OTP request: {}", e);
                Err(format!("Failed to sign OTP request: {}", e))
            }
        }
    }
}

pub async fn create_otp_request_message(
    csrf_token: String,
    wallet_address: String,
) -> Result<WebsocketMessage, String> {
    info!(target: LOG_TARGET, "Creating OTP request for wallet: {}", wallet_address);
    
    let otp_request = OtpRequest::new(csrf_token, wallet_address);
    let signed_message = otp_request.sign().await?;
    
    let websocket_message = WebsocketMessage {
        event: "request-otp".to_string(),
        data: Some(serde_json::to_value(signed_message).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to serialize OTP request: {}", e);
            format!("Failed to serialize OTP request: {}", e)
        })?),
        signature: None,
        pub_key: None,
    };
    
    info!(target: LOG_TARGET, "OTP request message created successfully");
    Ok(websocket_message)
}

pub fn generate_nonce() -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}-{}", timestamp, uuid::Uuid::new_v4())
}
