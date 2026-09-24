import { GpuDevice } from './app-status';

export enum SetupPhase {
    Core = 'Core',
    CpuMining = 'CpuMining',
    GpuMining = 'GpuMining',
    Wallet = 'Wallet',
    Node = 'Node',
}

export enum TariAddressType {
    Internal = 0,
    External = 1,
}

export enum WalletUIMode {
    Standard = 'Standard',
    Seedless = 'Seedless',
    ExchangeSpecificMiner = 'ExchangeSpecificMiner',
}

export interface TariAddressUpdatePayload {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address_type: TariAddressType;
}

export interface WalletScanningProgressUpdatePayload {
    scanned_height: number;
    total_height: number;
    progress: number;
    is_initial_scan_complete: boolean;
}

export interface DetectedDevicesPayload {
    devices: GpuDevice[];
}

export interface CriticalProblemPayload {
    title?: string;
    description?: string;
    error_message?: string;
}

export interface ShowReleaseNotesPayload {
    release_notes: string;
    is_app_update_available: boolean;
    should_show_dialog: boolean;
}

export interface NodeTypeUpdatePayload {
    node_type?: 'Local' | 'Remote' | 'RemoteUntilLocal' | 'LocalAfterRemote';
    node_identity?: {
        public_key: string;
        public_addresses: string[];
    };
    node_connection_address?: string;
}

export type BackgroundNodeSyncUpdatePayload =
    | {
          step: 'Startup';
          initial_connected_peers: number;
          required_peers: number;
      }
    | {
          step: 'Header';
          local_header_height: number;
          tip_header_height: number;
          local_block_height: number;
          tip_block_height: number;
      }
    | {
          step: 'Block';
          local_header_height: number;
          tip_header_height: number;
          local_block_height: number;
          tip_block_height: number;
      }
    | {
          step: 'Done';
      };

export type ConnectionStatusPayload = 'InProgress' | 'Succeed' | 'Failed';

export interface ProgressTrackerUpdatePayload {
    phase_title: string;
    title: string;
    progress: number;
    title_params: Record<string, string>;
    setup_phase: SetupPhase;
    is_completed: boolean;
}

export enum GpuMinerType {
    LolMiner = 'LolMiner',
    TariMiner = 'TariMiner',
}

export enum GpuMinerFeature {
    SoloMining = 'SoloMining',
    PoolMining = 'PoolMining',
    DeviceExclusion = 'DeviceExclusion',
    SingleDeviceMining = 'SingleDeviceMining',
    MiningIntensity = 'MiningIntensity',
    EngineSelection = 'EngineSelection',
}

export enum MiningAlgorithm {
    C29 = 'C29',
    RandomX = 'RandomX',
}

export enum MinerControlsState {
    Initiated = 'Initiated',
    Started = 'Started',
    Stopped = 'Stopped',
    Restarting = 'Restarting',
    Idle = 'Idle',
}

export interface GpuMiner {
    miner_type: GpuMinerType;
    features: GpuMinerFeature[];
    supported_algorithms: MiningAlgorithm[];
    is_healthy: boolean;
    last_error?: string;
}

/** Which caller asked for a transaction: the in-app/tapplet bridge path, or the MCP tool. */
export type TransactionOrigin = 'app' | 'mcp';

/**
 * Optional context attached to the `EnterPin` event, so the PIN dialog can tell the user
 * what they are authorising instead of asking for a PIN out of the blue.
 */
export interface SendPinPromptContext {
    kind: 'send';
    amount_micro_minotari: number;
    destination: string;
    payment_id?: string | null;
}

/** The wallet details were missing from the config and are being rebuilt from the stored seed. */
export interface RestoreWalletDetailsPinPromptContext {
    kind: 'restore_wallet_details';
}

/** The stored seed is PIN-protected although the settings say no PIN is set. */
export interface SeedNeedsPinPromptContext {
    kind: 'seed_needs_pin';
}

/** Burning L1 funds to be claimed on L2 by `claim_public_key`. */
export interface BurnPinPromptContext {
    kind: 'burn';
    amount_micro_minotari: number;
    claim_public_key: string;
    payment_id?: string | null;
}

/** Sending XTR (micro units) on L2 from `account` to the Ootle address `destination`. */
export interface L2SendPinPromptContext {
    kind: 'l2_send';
    amount_micro_minotari: number;
    destination: string;
    account: string;
}

export type PinPromptContext =
    | SendPinPromptContext
    | BurnPinPromptContext
    | L2SendPinPromptContext
    | RestoreWalletDetailsPinPromptContext
    | SeedNeedsPinPromptContext;

export type SpendKind = 'send' | 'burn' | 'l2_send';

/** XTR in micro units. Revealed sits in the account vault, confidential in stealth UTXOs. */
export interface L2Balance {
    revealed: number;
    confidential: number;
}

/** A settled XTR movement on an L2 account. `amount` is signed micro XTR. */
export interface L2BalanceChange {
    id: number;
    transaction_id: string | null;
    amount: number;
    source: 'transaction' | 'scan' | 'recovery';
    timestamp: number;
}

/** A transaction this wallet submitted on L2, with its current status. */
export interface L2Transaction {
    id: string;
    status: string;
    fee: number | null;
    invalid_reason: string | null;
    timestamp: number;
}

export interface L2Account {
    name: string | null;
    address: string;
    component_address: string;
    /** Owner public key, hex. The key an L1 burn is claimed with. */
    public_key: string;
    is_default: boolean;
    balance: L2Balance;
    history: L2BalanceChange[];
    transactions: L2Transaction[];
}

export interface L2WalletState {
    enabled: boolean;
    accounts: L2Account[];
}
