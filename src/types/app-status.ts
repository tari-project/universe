import { AppModule } from '@app/store/types/setup';

export interface TorConfig {
    control_port: number;
    use_bridges: boolean;
    bridges: string[];
}

export enum SystemDependencyStatus {
    Installed = 'Installed',
    NotInstalled = 'NotInstalled',
    Unknown = 'Unknown',
}

interface Manufacturer {
    name: string;
    logo_url: string;
    url: string;
}

interface SystemDependencyUIInfo {
    display_name: string;
    display_description: string;
    manufacturer: Manufacturer;
}

export interface SystemDependency {
    id: string;
    status: SystemDependencyStatus;
    download_url: string;
    ui_info: SystemDependencyUIInfo;
    required_by_app_modules: AppModule[];
}

export enum OutputStatus {
    Unspent = 'Unspent',
    Locked = 'Locked',
    Spent = 'Spent',
}

export enum OutputType {
    /// A standard output.
    Standard = 0,
    /// Output is a coinbase output, must not be spent until maturity.
    Coinbase = 1,
    /// Output is a burned output and can not be spent ever.
    Burn = 2,
    /// Output containing a validator node registration
    ValidatorNodeRegistration = 3,
    /// Output containing a new re-usable code template.
    CodeTemplateRegistration = 4,
    /// Output containing a sidechain checkpoint
    SidechainCheckpoint = 5,
    /// Output containing a sidechain proof.
    SidechainProof = 6,
    /// Output containing a validator node exit
    ValidatorNodeExit = 7,
}
export interface MinotariWalletOutputDetails {
    confirmed_height?: number;
    status: OutputStatus;
    output_type: OutputType;
    coinbase_extra?: string;
}

export interface MinotariWalletDetails {
    description: string;
    balance_credit: number;
    balance_debit: number;
    claimed_recipient_address: string;
    claimed_sender_address: string;
    memo_parsed?: string;
    memo_hex?: string;
    claimed_fee: number;
    claimed_amount?: number;
    recieved_output_details?: MinotariWalletOutputDetails;
    spent_output_details?: MinotariWalletOutputDetails;
}

export interface MinotariWalletTransaction {
    id: string;
    account_id: number;
    mined_height: number;
    effective_date: string;
    debit_balance: number;
    credit_balance: number;
    transaction_balance: number;
    is_negative: boolean;
    operations: MinotariWalletDetails[];
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

export interface GpuDevice {
    name: string;
    device_id: number;
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
