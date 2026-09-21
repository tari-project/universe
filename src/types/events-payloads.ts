import { GpuDevice, TransactionInfo } from './app-status';

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

export interface NewBlockHeightPayload {
    block_height: number;
    coinbase_transaction?: TransactionInfo;
}

export interface DetectedDevicesPayload {
    devices: GpuDevice[];
}

export interface CriticalProblemPayload {
    title?: string;
    description?: string;
    error_message?: string;
}

/**
 * Why the app entered the wallet recovery state.
 *
 * Mirrors `WalletRecoveryReason` in `src-tauri/src/internal_wallet.rs`. The backend sends an
 * enum-like value only - never an error string, a path or an id - so all user-facing copy is
 * chosen here.
 */
export type WalletRecoveryReason =
    | 'initialization_failed'
    | 'seed_unavailable'
    | 'config_corrupted'
    | 'legacy_seed_undecryptable'
    | 'legacy_config_unreadable';

export interface WalletRecoveryPayload {
    reason: WalletRecoveryReason;
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

export type PinPromptContext = SendPinPromptContext;
