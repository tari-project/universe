import { GpuDevice, TransactionInfo, WalletBalance } from './app-status';

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
    balance: WalletBalance;
}

export interface DetectedDevicesPayload {
    devices: GpuDevice[];
}

export interface DetectedAvailableGpuEngines {
    engines: string[];
    selected_engine: string;
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
    Glytex = 'Glytex',
    Graxil = 'Graxil',
    LolMiner = 'LolMiner',
}

export enum GpuMinerFeature {
    SoloMining = 'SoloMining',
    PoolMining = 'PoolMining',
    DeviceExclusion = 'DeviceExclusion',
    MiningIntensity = 'MiningIntensity',
    EngineSelection = 'EngineSelection',
}

export enum GpuMiningAlgorithm {
    SHA3X = 'SHA3X',
    C29 = 'C29',
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
    supported_algorithms: GpuMiningAlgorithm[];
    is_healthy: boolean;
    last_error?: string;
}
