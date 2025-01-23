use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use log::warn;
use serde::{Deserialize, Serialize};

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
