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

/** Direction of the transaction from the user's perspective */
export type TransactionDirection = 'incoming' | 'outgoing';

/** Source/type of the transaction */
export type TransactionSource = 'transfer' | 'coinbase' | 'one_sided' | 'unknown';

/** Simplified status for end users */
export type TransactionDisplayStatus = 'pending' | 'confirmed' | 'cancelled';

/** Output status */
export type OutputStatus = 'Unspent' | 'Locked' | 'Spent' | 'Cancelled';

/** Information about the other party in the transaction */
export interface CounterpartyInfo {
    /** Base58 address */
    address: string;
    /** Emoji representation */
    address_emoji?: string;
    /** Optional alias/label if user has saved it */
    label?: string;
}

/** Blockchain-related information */
export interface BlockchainInfo {
    /** Block height where mined */
    block_height: number;
    /** Timestamp of the block (ISO 8601 string) */
    timestamp: string;
    /** Number of confirmations */
    confirmations: number;
}

/** Fee information for outgoing transactions */
export interface FeeInfo {
    /** Fee in microTari */
    amount: number;
    /** User-friendly display */
    amount_display: string;
}

/** A transaction input (references a previously created output that is being spent) */
export interface TransactionInput {
    /** Hash of the output being spent (hex encoded) */
    output_hash: string;
    /** Amount being spent (microTari) */
    amount: number;
    /** ID of the matched output in our database (if found) */
    matched_output_id?: number;
    /** Whether this input was successfully matched */
    is_matched: boolean;
}

/** A transaction output (newly created output) */
export interface TransactionOutput {
    /** Output commitment hash (hex encoded) */
    hash: string;
    /** Amount (microTari) */
    amount: number;
    /** Output status */
    status: OutputStatus;
    /** Block height where confirmed */
    confirmed_height?: number;
    /** Output type (Standard, Coinbase, etc.) */
    output_type: string;
    /** Whether this is likely a change output */
    is_change: boolean;
}

/** Advanced transaction details for power users */
export interface TransactionDetails {
    /** Account ID this belongs to */
    account_id: number;
    /** Total credits (incoming value) */
    total_credit: number;
    /** Total debits (outgoing value) */
    total_debit: number;
    /** Transaction inputs (spent outputs) */
    inputs: TransactionInput[];
    /** Transaction outputs (created outputs) */
    outputs: TransactionOutput[];
    /** Raw output type from chain (for debugging) */
    output_type?: string;
    /** Coinbase extra data (only for mining rewards) */
    coinbase_extra?: string;
    /** Raw memo in hex (for debugging) */
    memo_hex?: string;
    /** Hashes of outputs sent in this transaction (hex encoded) */
    sent_output_hashes: string[];
}

/** User-friendly transaction representation from DisplayedTransaction */
export interface DisplayedTransaction {
    // ===== Essential Info =====
    /** Unique identifier */
    id: string;
    /** Did user receive or send? */
    direction: TransactionDirection;
    /** What kind of transaction (transfer, mining, etc.) */
    source: TransactionSource;
    /** Current status */
    status: TransactionDisplayStatus;
    /** Net amount in microTari (always positive, use direction for sign) */
    amount: number;
    /** User-friendly amount (e.g., "1,234.567890 XTM") */
    amount_display: string;
    /** Optional message/memo */
    message?: string;

    // ===== Counterparty Info =====
    counterparty?: CounterpartyInfo;

    // ===== Blockchain Info =====
    blockchain: BlockchainInfo;

    // ===== Fee Info (only for outgoing) =====
    fee?: FeeInfo;

    // ===== Advanced Details =====
    details: TransactionDetails;

    // ===== Bridge Transaction Details (added by frontend) =====
    bridge_transaction_details?: {
        status: UserTransactionDTO.status;
        transactionHash?: string;
        amountAfterFee?: string;
    };
}

// ============================================================================
// Legacy Types (kept for backward compatibility)
// ============================================================================

export enum InternalTransactionType {
    Sent = 'Sent',
    Received = 'Received',
    Coinbase = 'Coinbase',
}

export enum TranactionDetailsType {
    Input = 'Input',
    Output = 'Output',
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

export interface WalletDetails {
    description: string;
    balance_credit: number;
    balance_debit: number;
    claimed_recipient_address?: string;
    claimed_sender_address?: string;
    memo_parsed?: string;
    memo_hex?: string;
    claimed_fee: number;
    claimed_amount?: number;
    confirmed_height?: number;
    status: OutputStatus;
    output_type: OutputType;
    coinbase_extra: string;
    details_type: TranactionDetailsType;
}

/** @deprecated Use DisplayedTransaction instead */
export interface WalletTransaction {
    id: string;
    account_id: number;
    mined_height: number;
    effective_date: string;
    debit_balance: number;
    credit_balance: number;
    transaction_balance: number;
    claimed_recipient_address?: string;
    claimed_recipient_address_emoji?: string;
    claimed_sender_address?: string;
    claimed_sender_address_emoji?: string;
    internal_transaction_type: InternalTransactionType;
    memo_parsed?: string;
    inputs: WalletDetails[];
    outputs: WalletDetails[];
    bridge_transaction_details?: {
        status: UserTransactionDTO.status;
        transactionHash?: string;
    };
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
