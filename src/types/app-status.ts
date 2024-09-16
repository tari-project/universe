import { modeType } from '../store/types';

export interface AppStatus {
    cpu?: CpuMinerStatus;
    gpu?: GpuMinerStatus;
    gpu_earnings?: EstimatedEarnings;
    base_node?: BaseNodeStatus;
    hardware_status?: HardwareStatus;
    wallet_balance?: WalletBalance;
    applications_versions?: ApplicationsVersions;
    user_inactivity_timeout?: number;
    current_user_inactivity_duration?: number;
    mode: modeType;
    auto_mining: boolean;
    monero_address?: string;
    tari_address_base58?: string;
    tari_address_emoji?: string;
    p2pool_enabled: boolean;
    p2pool_stats?: P2poolStatsResult;
    cpu_mining_enabled: boolean;
    gpu_mining_enabled: boolean;
    telemetry_mode: boolean;
}

export interface P2poolStatsResult {
    randomx: P2poolStats;
    sha3: P2poolStats;
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
    total_earnings: Record<string, number>;
    estimated_earnings: Map<string, P2poolEstimatedEarnings>;
    miner_block_stats: P2poolBlockStats;
    p2pool_block_stats: P2poolBlockStats;
}

export interface P2poolTribeDetails {
    id: string;
    name: string;
}

export interface P2poolBlockStats {
    accepted: number;
    rejected: number;
    submitted: number;
}

export interface P2poolEstimatedEarnings {
    one_minute: number;
    one_hour: number;
    one_day: number;
    one_week: number;
    one_month: number;
}

export interface P2poolStatsBlock {
    hash: string;
    height: number;
    timestamp: number;
    miner_wallet_address?: string;
}

export interface HardwareParameters {
    label: string;
    usage_percentage: number;
    current_temperature: number;
    max_temperature: number;
}

export interface HardwareStatus {
    cpu: HardwareParameters;
    gpu: HardwareParameters;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    estimated_earnings: number;
    connection: CpuMinerConnectionStatus;
}

export interface CpuMinerConnectionStatus {
    is_connected: boolean;
}

export interface EstimatedEarnings {
    estimated_earnings: number;
}

export interface GpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    estimated_earnings: number;
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
    tari_universe: string;
    xmrig: string;
    minotari_node: string;
    mm_proxy: string;
    wallet: string;
    sha_p2pool: string;
}
