use tauri::ipc::InvokeError;

use crate::{
    ootle::{
        ootle_wallet_json_rpc_client::OotleWalletJsonRpcClient,
        temp_types::{
            AccountsCreateRequest, AccountsCreateResponse, AccountsGetBalancesRequest,
            AccountsGetBalancesResponse, AccountsListRequest, AccountsListResponse,
        },
    },
    UniverseAppState,
};

async fn build_client(state: tauri::State<'_, UniverseAppState>) -> OotleWalletJsonRpcClient {
    let port = state.ootle_wallet_manager.get_json_rpc_port().await;
    OotleWalletJsonRpcClient::new(port)
}

#[tauri::command]
pub async fn ootle_list_accounts(
    request: AccountsListRequest,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<AccountsListResponse, InvokeError> {
    let client = build_client(state).await;
    client
        .list_accounts(request)
        .await
        .map_err(InvokeError::from_anyhow)
}

#[tauri::command]
pub async fn ootle_create_account(
    request: AccountsCreateRequest,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<AccountsCreateResponse, InvokeError> {
    let client = build_client(state).await;
    client
        .create_account(request)
        .await
        .map_err(InvokeError::from_anyhow)
}

#[tauri::command]
pub async fn ootle_get_balances(
    request: AccountsGetBalancesRequest,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<AccountsGetBalancesResponse, InvokeError> {
    let client = build_client(state).await;
    client
        .get_balances(request)
        .await
        .map_err(InvokeError::from_anyhow)
}
