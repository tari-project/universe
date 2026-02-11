use crate::events::ConnectionStatusPayload;
use crate::events_emitter::EventsEmitter;
use crate::mining::cpu::{CpuMinerConnectionStatus, CpuMinerStatus};
use crate::mining::gpu::consts::GpuMinerStatus;
use crate::node::node_adapter::BaseNodeStatus;
use crate::wallet::wallet_types::WalletBalance;
use log::info;
use serde::Deserialize;
use tari_transaction_components::tari_amount::MicroMinotari;

const LOG_TARGET: &str = "tari::universe::e2e";

#[derive(Debug, Deserialize)]
pub struct TestCpuMiningState {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
    pub is_connected: bool,
}

#[derive(Debug, Deserialize)]
pub struct TestGpuMiningState {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
}

#[derive(Debug, Deserialize)]
pub struct TestBaseNodeState {
    pub block_height: u64,
    pub block_time: u64,
    pub is_synced: bool,
    pub num_connections: u64,
    pub block_reward: u64,
}

#[derive(Debug, Deserialize)]
pub struct TestWalletBalance {
    pub available_balance: u64,
    pub timelocked_balance: u64,
    pub pending_incoming_balance: u64,
    pub pending_outgoing_balance: u64,
}

#[tauri::command]
pub async fn e2e_emit_cpu_mining_status(state: TestCpuMiningState) -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Setting CPU mining state: {:?}", state);
    let status = CpuMinerStatus {
        is_mining: state.is_mining,
        hash_rate: state.hash_rate,
        estimated_earnings: state.estimated_earnings,
        connection: CpuMinerConnectionStatus {
            is_connected: state.is_connected,
        },
    };
    EventsEmitter::emit_cpu_mining_update(status).await;
    Ok(())
}

#[tauri::command]
pub async fn e2e_emit_gpu_mining_status(state: TestGpuMiningState) -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Setting GPU mining state: {:?}", state);
    let status = GpuMinerStatus {
        is_mining: state.is_mining,
        hash_rate: state.hash_rate,
        estimated_earnings: state.estimated_earnings,
        ..Default::default()
    };
    EventsEmitter::emit_gpu_mining_update(status).await;
    Ok(())
}

#[tauri::command]
pub async fn e2e_emit_base_node_status(state: TestBaseNodeState) -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Setting base node state: {:?}", state);
    let status = BaseNodeStatus {
        block_height: state.block_height,
        block_time: state.block_time,
        is_synced: state.is_synced,
        num_connections: state.num_connections,
        block_reward: MicroMinotari(state.block_reward),
        ..Default::default()
    };
    EventsEmitter::emit_base_node_update(status).await;
    Ok(())
}

#[tauri::command]
pub async fn e2e_emit_wallet_balance(state: TestWalletBalance) -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Setting wallet balance: {:?}", state);
    let balance = WalletBalance {
        available_balance: MicroMinotari(state.available_balance),
        timelocked_balance: MicroMinotari(state.timelocked_balance),
        pending_incoming_balance: MicroMinotari(state.pending_incoming_balance),
        pending_outgoing_balance: MicroMinotari(state.pending_outgoing_balance),
    };
    EventsEmitter::emit_wallet_balance_update(balance).await;
    Ok(())
}

#[tauri::command]
pub async fn e2e_emit_close_splashscreen() -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Emitting close splashscreen");
    EventsEmitter::emit_close_splashscreen().await;
    Ok(())
}

#[tauri::command]
pub async fn e2e_emit_connection_status(status: String) -> Result<(), String> {
    info!(target: LOG_TARGET, "E2E: Emitting connection status: {}", status);
    let payload = match status.as_str() {
        "succeed" | "Succeed" => ConnectionStatusPayload::Succeed,
        "failed" | "Failed" => ConnectionStatusPayload::Failed,
        _ => ConnectionStatusPayload::InProgress,
    };
    EventsEmitter::emit_connection_status_changed(payload).await;
    Ok(())
}
