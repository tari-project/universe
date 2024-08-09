import { modeType } from "../store/types";

export interface AppStatus {
    cpu?: CpuMinerStatus;
    base_node?: BaseNodeStatus;
    wallet_balance?: WalletBalance;
    mode: modeType;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    cpu_usage: number;
    cpu_brand: string;
    estimated_earnings: number;
    connection: CpuMinerConnectionStatus;
}
export interface CpuMinerConnectionStatus {
    is_connected: boolean;
}

export interface BaseNodeStatus {
    block_height: number;
    block_time: number;
    is_synced: boolean;
}

export interface WalletBalance {
    available_balance?: number;
    timelocked_balance?: number;
    pending_incoming_balance?: number;
    pending_outgoing_balance?: number;
}
