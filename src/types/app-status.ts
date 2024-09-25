import { Language } from '@app/i18initializer';
import { modeType } from '../store/types';

export interface AppConfig {
    config_version: number;
    config_file?: string;
    mode: modeType;
    auto_mining: boolean;
    p2pool_enabled: boolean;
    last_binaries_update_timestamp: string;
    has_system_language_been_proposed: boolean;
    should_always_use_system_language: boolean;
    application_language: Language;
    allow_telemetry: boolean;
    anon_id: string;
    monero_address: string;
    gpu_mining_enabled: boolean;
    cpu_mining_enabled: boolean;
}

export interface CpuMinerMetrics {
    hardware?: HardwareParameters;
    mining: CpuMinerStatus;
}

export interface GpuMinerMetrics {
    hardware?: HardwareParameters;
    mining: GpuMinerStatus;
}

export interface MinerMetrics {
    cpu: CpuMinerMetrics;
    gpu: GpuMinerMetrics;
    base_node: BaseNodeStatus;
}

export interface TariWalletDetails {
    wallet_balance: WalletBalance;
    tari_address_base58: string;
    tari_address_emoji: string;
}

export interface P2poolStatsResult {
    randomx: P2poolStats;
    sha3: P2poolStats;
}

export interface P2poolStats {
    connected: boolean;
    connected_since?: number;
    squad: P2poolSquadDetails;
    num_of_miners: number;
    last_block_won?: P2poolStatsBlock;
    share_chain_height: number;
    pool_hash_rate: number;
    pool_total_earnings: number;
    pool_total_estimated_earnings: P2poolEstimatedEarnings;
    total_earnings: Record<string, number>;
    estimated_earnings: Map<string, P2poolEstimatedEarnings>;
    miner_block_stats: P2poolBlockStats;
    p2pool_block_stats: P2poolBlockStats;
}

export interface P2poolSquadDetails {
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
    is_available: boolean;
}

export interface BaseNodeStatus {
    block_height: number;
    block_time: number;
    is_synced: boolean;
    is_connected: boolean;
    connected_peers: string[];
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
