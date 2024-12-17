use axum_jrpc::{JsonRpcAnswer, JsonRpcRequest, JsonRpcResponse};
use log::{error, info};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::Serialize;
use std::{net::SocketAddr, str::FromStr};
use tari_wallet_daemon_client::types::{
    AuthLoginAcceptRequest, AuthLoginAcceptResponse, AuthLoginRequest, AuthLoginResponse,
};

const JSON_CONNECT_ADDRESS: &str = "127.0.0.1:18010"; // TODO use db to get endpoint
const LOG_TARGET: &str = "tari::dan::wallet_daemon";

pub async fn permission_token(grpc_port: Option<u16>) -> Result<(String, String), anyhow::Error> {
    let req_params = AuthLoginRequest {
        permissions: vec!["Admin".to_string()],
        duration: None,
    };
    info!(target: LOG_TARGET, "🚀 Auth tokens request");
    let req_res = make_request(None, "auth.request".to_string(), &req_params, grpc_port).await?;
    let req_res: AuthLoginResponse = serde_json::from_value(req_res)?;

    info!(target: LOG_TARGET, "🚀 Auth tokens got response");
    let auth_token = req_res.auth_token;

    let acc_params = AuthLoginAcceptRequest {
        auth_token: auth_token.clone(),
        name: auth_token.clone(),
    };
    info!(target: LOG_TARGET, "🚀 Auth tokens accept request");
    let acc_res = make_request(None, "auth.accept".to_string(), &acc_params, grpc_port).await?;
    let acc_res: AuthLoginAcceptResponse = serde_json::from_value(acc_res)?;

    info!(target: LOG_TARGET, "🚀 Auth tokens accept response");
    Ok((acc_res.permissions_token, auth_token))
}

// pub async fn account_create(account_name: Option<String>, permissions_token: String) -> Result<(), anyhow::Error> {
//   let create_acc_params = AccountsCreateRequest {
//     account_name,
//     custom_access_rules: None,
//     is_default: false,
//     key_id: None,
//     max_fee: None,
//   };
//   let _resp = make_request(Some(permissions_token), "accounts.create".to_string(), create_acc_params).await?;
//   Ok(())
// }

// pub async fn free_coins(account_name: Option<String>, permissions_token: String) -> Result<Value, anyhow::Error> {
//   let free_coins_params = AccountsCreateFreeTestCoinsRequest {
//     account: account_name.map(|acc_name| ComponentAddressOrName::Name(acc_name)),
//     amount: (100_000_000).into(),
//     max_fee: None,
//     key_id: None,
//   };
//   let resp = make_request(
//     Some(permissions_token),
//     "accounts.create_free_test_coins".to_string(),
//     free_coins_params
//   ).await?;

//   Ok(resp)
// }

// pub async fn balances(
//   account_name: Option<String>,
//   permissions_token: String
// ) -> Result<AccountsGetBalancesResponse, Error> {
//   let balance_req = AccountsGetBalancesRequest {
//     account: account_name.map(|acc_name| ComponentAddressOrName::Name(acc_name)),
//     refresh: false,
//   };
//   let method = "accounts.get_balances".to_string();
//   let serialized_params = serde_json::to_string(&balance_req).map_err(|e| Error::JsonParsingError(e))?;
//   let balance_res = make_request(Some(permissions_token), method.clone(), balance_req).await.map_err(
//     |_| Error::ProviderError {
//       method,
//       params: serialized_params,
//     }
//   )?;
//   let balance_res: AccountsGetBalancesResponse = serde_json::from_value(balance_res)?;

//   Ok(balance_res)
// }

pub async fn make_request<T: Serialize>(
    token: Option<String>,
    method: String,
    params: T,
    grpc_port: Option<u16>,
) -> Result<serde_json::Value, anyhow::Error> {
    info!(target: LOG_TARGET, "Make request");
    let json_connect_address = match grpc_port {
        Some(port) => format!("127.0.0.1:{}", port),
        None => JSON_CONNECT_ADDRESS.to_string(),
    };
    let address = SocketAddr::from_str(&json_connect_address).unwrap();
    let url = format!("http://{}", address);
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
