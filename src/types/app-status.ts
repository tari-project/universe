export interface TorConfig {
    control_port: number;
    use_bridges: boolean;
    bridges: string[];
}

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
    payment_reference?: string;
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

export enum GpuVendor {
    NVIDIA,
    AMD,
    Intel,
    Unknown,
}

export enum GpuDeviceType {
    Integrated,
    Dedicated,
    Unknown,
}

export interface GpuDevice {
    name: string;
    device_id: number;
    platform_name: string;
    vendor: GpuVendor;
    max_work_group_size: number;
    max_compute_units: number;
    global_mem_size: number;
    device_type: GpuDeviceType;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    estimated_earnings: number;
    connection: CpuMinerConnectionStatus;
}

export interface PoolStats {
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
    sha_network_hashrate: number;
    monero_randomx_network_hashrate: number;
    tari_randomx_network_hashrate: number;
    block_reward: number;
    block_height: number;
    block_time: number;
    is_synced: boolean;
    num_connections: number;
    readiness_status: string;
}

export interface WalletBalance {
    available_balance: number;
    timelocked_balance: number;
    pending_incoming_balance: number;
    pending_outgoing_balance: number;
}

interface ApplicationsInformation {
    version: string;
    port?: number;
}

export interface ApplicationsVersions {
    tari_universe: ApplicationsInformation;
    xmrig: ApplicationsInformation;
    minotari_node: ApplicationsInformation;
    mm_proxy: ApplicationsInformation;
    wallet: ApplicationsInformation;
    sha_p2pool: ApplicationsInformation;
    bridge: ApplicationsInformation;
}

export interface PaperWalletDetails {
    qr_link: string;
    password: string;
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
