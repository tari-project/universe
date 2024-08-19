import { modeType } from '../store/types';

export interface AppStatus {
    cpu?: CpuMinerStatus;
    base_node?: BaseNodeStatus;
    wallet_balance?: WalletBalance;
    applications_versions?: ApplicationsVersions;
    main_app_version?: string;
    mode: modeType;
    auto_mining: boolean;
    p2pool_enabled: boolean;
    p2pool_stats?: P2poolStats;
}

export interface P2poolStats {
    connected: boolean;
    connected_since?: number;
    tribe: P2poolTribeDetails;
    num_of_miners: number;
    last_block_won?: P2poolStatsBlock;
    share_chain_height: number;
    pool_hash_rate: bigint;
    pool_total_earnings: number;
    pool_total_estimated_earnings: P2poolEstimatedEarnings;
    total_earnings: Map<string, number>;
    estimated_earnings: Map<string, P2poolEstimatedEarnings>;
    miner_block_stats: P2poolBlockStats,
    p2pool_block_stats: P2poolBlockStats,
}

export interface P2poolTribeDetails {
    id: string,
    name: string,
}

export interface P2poolBlockStats {
    accepted: number,
    rejected: number,
    submitted: number,
}

export interface P2poolEstimatedEarnings {
    one_minute: number;
    one_hour: number;
    one_day: number;
    one_week: number;
    one_month: number;
}

export interface P2poolStatsBlock {
    hash: string,
    height: number,
    timestamp: number,
    miner_wallet_address?: string,
}

export interface CpuMinerStatus {
    is_mining_enabled: boolean;
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

export interface ApplicationsVersions {
    xmrig: string;
    minotari_node: string;
    mm_proxy: string;
    wallet: string;
    sha_p2pool: string;
}
