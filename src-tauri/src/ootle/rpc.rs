use axum_jrpc::{JsonRpcAnswer, JsonRpcRequest, JsonRpcResponse};
use log::{error, info};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use reqwest::Url;
use serde::Serialize;
use std::{net::SocketAddr, str::FromStr};
use tari_wallet_daemon_client::types::{
    AuthLoginAcceptRequest, AuthLoginAcceptResponse, AuthLoginRequest, AuthLoginResponse,
};

use crate::consts::DAN_WALLET_JSON_ADDRESS;

// const JSON_CONNECT_ADDRESS: &str = "18.216.193.9:12028"; // TODO use db to get endpoint
// const JSON_CONNECT_ADDRESS: &str = "127.0.0.1:18010"; // TODO use db to get endpoint
const LOG_TARGET: &str = "tari::dan::wallet_daemon";

pub async fn permission_token(jrpc_port: Option<u16>) -> Result<(String, String), anyhow::Error> {
    let req_params = AuthLoginRequest {
        permissions: vec!["Admin".to_string()],
        duration: None,
    };
    info!(target: LOG_TARGET, "🌟 RPC Auth request port: {:?} with params: {:?}", &jrpc_port, &req_params);
    info!(target: LOG_TARGET, "🚀 Auth tokens request");
    let req_res = make_request(None, "auth.request".to_string(), &req_params, jrpc_port).await?;
    let req_res: AuthLoginResponse = serde_json::from_value(req_res)?;

    info!(target: LOG_TARGET, "🚀 Auth tokens got response");
    let auth_token = req_res.auth_token;

    let acc_params = AuthLoginAcceptRequest {
        auth_token: auth_token.clone(),
        name: auth_token.clone(),
    };
    info!(target: LOG_TARGET, "🚀 Auth tokens accept request");
    let acc_res = make_request(None, "auth.accept".to_string(), &acc_params, jrpc_port).await?;
    let acc_res: AuthLoginAcceptResponse = serde_json::from_value(acc_res)?;

    info!(target: LOG_TARGET, "🚀 Auth tokens accept response");
    Ok((acc_res.permissions_token, auth_token))
}

pub async fn make_request<T: Serialize>(
    token: Option<String>,
    method: String,
    params: T,
    jrpc_port: Option<u16>,
) -> Result<serde_json::Value, anyhow::Error> {
    info!(target: LOG_TARGET, "Make request");
    let json_connect_address = jrpc_port.map_or_else(
        || DAN_WALLET_JSON_ADDRESS.to_string(),
        |port| format!("127.0.0.1:{}", port),
    );
    let address = SocketAddr::from_str(&json_connect_address).unwrap();
    let url = Url::parse(&format!("http://{}", address)).unwrap();
    info!(target: LOG_TARGET, "🌟 MAKE REQUEST URL: {:?} | socket address: {:?}", &url, &address);

    let method_name = method.clone();
    let client = reqwest::Client::new();

    let body = JsonRpcRequest {
        id: axum_jrpc::Id::Num(0),
        method,
        params: serde_json::to_value(params)?,
    };
    let mut builder = client.post(url).header(CONTENT_TYPE, "application/json");
    if let Some(token) = token {
        builder = builder.header(AUTHORIZATION, format!("Bearer {token}"));
    }
    let resp = builder
        .json(&body)
        .send()
        .await?
        .json::<JsonRpcResponse>()
        .await?;
    match resp.result {
        JsonRpcAnswer::Result(result) => {
            info!(target: LOG_TARGET, "👁️‍🗨️ JSON rpc request {:?} completed successfully", method_name);
            Ok(result)
        }
        JsonRpcAnswer::Error(error) => {
            error!(target: LOG_TARGET, "🚨 JSON rpc request {:?} error: {:?}", method_name, error);
            Err(anyhow::Error::msg(error.to_string()))
        }
    }
}
