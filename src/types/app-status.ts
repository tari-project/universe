import { AppModule } from '@app/store/types/setup';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';

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

// ============================================================================
// DisplayedTransaction Types (from minotari_wallet)
// ============================================================================

export enum TransactionDirection {
    Incoming = 'incoming',
    Outgoing = 'outgoing',
}

export enum TransactionSource {
    Transfer = 'transfer',
    Coinbase = 'coinbase',
    OneSided = 'one_sided',
    Unknown = 'unknown',
}

export enum TransactionDisplayStatus {
    Pending = 'pending',
    Unconfirmed = 'unconfirmed',
    Confirmed = 'confirmed',
    Cancelled = 'cancelled',
    Reorganized = 'reorganized',
    Rejected = 'rejected',
}

export enum OutputStatus {
    Unspent = 'Unspent',
    Locked = 'Locked',
    Spent = 'Spent',
}

export interface CounterpartyInfo {
    address: string;
    address_emoji?: string;
    label?: string;
}

export interface BlockchainInfo {
    block_height: number;
    timestamp: string;
    confirmations: number;
}

export interface FeeInfo {
    amount: number;
    amount_display: string;
}

export interface TransactionInput {
    output_hash: string;
    amount: number;
    matched_output_id?: number;
    is_matched: boolean;
}

export interface TransactionOutput {
    hash: string;
    amount: number;
    status: OutputStatus;
    confirmed_height?: number;
    output_type: string;
    is_change: boolean;
}

export interface TransactionDetails {
    account_id: number;
    total_credit: number;
    total_debit: number;
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
    output_type?: string;
    coinbase_extra?: string;
    memo_hex?: string;
    sent_output_hashes: string[];
}

export interface DisplayedTransaction {
    id: string;
    direction: TransactionDirection;
    source: TransactionSource;
    status: TransactionDisplayStatus;
    amount: number;
    amount_display: string;
    message?: string;
    counterparty?: CounterpartyInfo;
    blockchain: BlockchainInfo;
    fee?: FeeInfo;
    details: TransactionDetails;
    bridge_transaction_details?: {
        status: UserTransactionDTO.status;
        transactionHash?: string;
        amountAfterFee?: string;
    };
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

export type BridgeEnvs = string[];

export interface TariAddressVariants {
    emoji_string: string;
    base58: string;
    hex: string;
}
