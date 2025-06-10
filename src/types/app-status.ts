export interface TorConfig {
    control_port: number;
    use_bridges: boolean;
    bridges: string[];
}

// export interface AppConfig {
//     allow_telemetry: boolean;
//     anon_id: string;
//     application_language: Language;
//     auto_update: boolean;
//     config_file?: string;
//     config_version: number;
//     cpu_mining_enabled: boolean;
//     custom_max_cpu_usage: number;
//     custom_max_gpu_usage: GpuThreads[];
//     custom_power_levels_enabled: boolean;
//     display_mode: displayMode;
//     gpu_mining_enabled: boolean;
//     has_system_language_been_proposed: boolean;
//     last_binaries_update_timestamp: string;
//     mine_on_app_start: boolean;
//     mmproxy_monero_nodes: string[];
//     mmproxy_use_monero_fail: boolean;
//     mode: modeType;
//     monero_address: string;
//     p2pool_enabled: boolean;
//     paper_wallet_enabled: boolean;
//     sharing_enabled: boolean;
//     should_always_use_system_language: boolean;
//     should_auto_launch: boolean;
//     use_tor: boolean;
//     visual_mode: boolean;
//     window_settings: WindowSettings;
//     show_experimental_settings: boolean;
//     monero_address_is_generated?: boolean;
//     created_at: string;
//     p2pool_stats_server_port: number | null;
//     pre_release: boolean;
//     airdrop_tokens?: {
//         token: string;
//         refreshToken: string;
//     };
// }

export enum ExternalDependencyStatus {
    Installed = 'Installed',
    NotInstalled = 'NotInstalled',
    Unknown = 'Unknown',
}

interface Manufacturer {
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

export interface WalletAddress {
    tari_address_base58: string;
    tari_address_emoji: string;
    is_tari_address_generated: boolean;
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
    mined_in_block_height?: number;
}

export interface P2poolStatsResult {
    connection_info: P2poolConnectionInfo;
    connected_since?: number;
    randomx_stats: P2poolStats;
    sha3x_stats: P2poolStats;
}

interface P2poolConnectionInfo {
    listener_addresses: string[];
    connected_peers: number;
    network_info: P2poolNetworkInfo;
}

interface P2poolNetworkInfo {
    num_peers: number;
    connection_counters: P2poolConnectionCounters;
}

interface P2poolConnectionCounters {
    pending_incoming: number;
    pending_outgoing: number;
    established_incoming: number;
    established_outgoing: number;
}

export interface P2poolStats {
    squad: P2poolSquadDetails;
    num_of_miners: number;
    share_chain_height: number;
    height?: number;
    p2pool_block_stats: P2poolBlockStats;
}

interface PeerInfo {
    version: number;
    peer_id?: string;
    current_sha3x_height: number;
    current_random_x_height: number;
    current_sha3x_pow: number;
    current_random_x_pow: number;
    squad: string;
    timestamp: number;
    user_agent?: string;
    user_agent_version?: string;
    public_addresses: string[];
}

export interface ConnectedPeerInfo {
    peer_id: string;
    peer_info: PeerInfo;
    last_grey_list_reason?: string;
    last_ping?: string;
}

export interface P2poolConnections {
    peers: ConnectedPeerInfo[];
}

interface P2poolSquadDetails {
    id: string;
    name: string;
}

interface P2poolBlockStats {
    accepted: number;
    rejected: number;
    submitted: number;
}

interface GpuStatus {
    recommended_grid_size: number;
    recommended_block_size: number;
    max_grid_size: number;
}

export interface GpuSettings {
    is_excluded: boolean;
    is_available: boolean;
}

export interface GpuDevice {
    device_name: string;
    device_index: number;
    status: GpuStatus;
    settings: GpuSettings;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    estimated_earnings: number;
    connection: CpuMinerConnectionStatus;
    pool_status?: PoolStatus;
}

export interface PoolStatus {
    accepted_shares: number;
    unpaid: number;
    balance: number;
    min_payout: number;
}

interface CpuMinerConnectionStatus {
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
    sha_network_hashrate: number;
    randomx_network_hashrate: number;
}

export interface WalletBalance {
    available_balance: number;
    timelocked_balance: number;
    pending_incoming_balance: number;
    pending_outgoing_balance: number;
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

export interface GpuThreads {
    gpu_name: string;
    max_gpu_threads: number;
}
export interface MaxConsumptionLevels {
    max_cpu_threads: number;
    max_gpus_threads: GpuThreads[];
}

export interface NetworkStatus {
    download_speed: number;
    upload_speed: number;
    latency: number;
    is_too_low: boolean;
}

export interface BridgeEnvs {
    walletconnect_id: string;
    backend_api: string;
}

export interface TariAddressVariants {
    emoji_string: string;
    base58: string;
    hex: string;
}
