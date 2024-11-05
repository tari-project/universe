import { Language } from '@app/i18initializer';
import { displayMode, modeType } from '../store/types';

export interface TorConfig {
    control_port: number;
    use_bridges: boolean;
    bridges: string[];
}

export interface AppConfig {
    config_version: number;
    config_file?: string;
    mode: modeType;
    display_mode: displayMode;
    auto_mining: boolean;
    mine_on_app_start: boolean;
    p2pool_enabled: boolean;
    last_binaries_update_timestamp: string;
    has_system_language_been_proposed: boolean;
    should_always_use_system_language: boolean;
    should_auto_launch: boolean;
    application_language: Language;
    allow_telemetry: boolean;
    anon_id: string;
    monero_address: string;
    gpu_mining_enabled: boolean;
    cpu_mining_enabled: boolean;
    airdrop_ui_enabled: boolean;
    paper_wallet_enabled: boolean;
    use_tor: boolean;
    auto_update: boolean;
    custom_max_cpu_usage: number;
    custom_max_gpu_usage: number;
    custom_power_levels_enabled: boolean;
    reset_earnings: boolean;
    mmproxy_use_monero_fail: boolean;
    mmproxy_monero_nodes: string[];
}

export enum ExternalDependencyStatus {
    Installed = 'Installed',
    NotInstalled = 'NotInstalled',
    Unknown = 'Unknown',
}

export interface Manufacturer {
    name: string;
    logo: string;
    url: string;
}
export interface ExternalDependency {
    required_version_names: string[];
    display_name: string;
    display_description: string;
    download_url: string;
    version?: string;
    manufacturer: Manufacturer;
    status: ExternalDependencyStatus;
}

export interface CpuMinerMetrics {
    hardware?: HardwareParameters;
    mining: CpuMinerStatus;
}

export interface GpuMinerMetrics {
    hardware: HardwareParameters[];
    mining: GpuMinerStatus;
}

export interface MinerMetrics {
    sha_network_hash_rate: number;
    randomx_network_hash_rate: number;
    cpu: CpuMinerMetrics;
    gpu: GpuMinerMetrics;
    base_node: BaseNodeStatus;
}

export interface TariWalletDetails {
    wallet_balance: WalletBalance;
    tari_address_base58: string;
    tari_address_emoji: string;
}

export interface TransactionInfo {
    tx_id: number;
    source_address: string;
    dest_address: string;
    status: number;
    direction: number;
    amount: number;
    fee: number;
    is_cancelled: boolean;
    excess_sig: string;
    timestamp: number;
    message: string;
    payment_id: string;
}

export interface P2poolStatsResult {
    connected: boolean;
    peer_count: number;
    connection_info: P2poolConnectionInfo;
    connected_since?: number;
    randomx_stats: P2poolStats;
    sha3x_stats: P2poolStats;
}

export interface P2poolConnectionInfo {
    listener_addresses: string[];
    connected_peers: number;
    network_info: P2poolNetworkInfo;
}

export interface P2poolNetworkInfo {
    num_peers: number;
    connection_counters: P2poolConnectionCounters;
}

export interface P2poolConnectionCounters {
    pending_incoming: number;
    pending_outgoing: number;
    established_incoming: number;
    established_outgoing: number;
}

export interface P2poolStats {
    squad: P2poolSquadDetails;
    num_of_miners: number;
    share_chain_height: number;
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

export interface HardwareParameters {
    label: string;
    usage_percentage: number;
    current_temperature: number;
    max_temperature: number;
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

export interface PaperWalletDetails {
    qr_link: string;
    password: string;
}

export interface MaxConsumptionLevels {
    max_cpu_available: number;
    max_gpu_available: number;
}
