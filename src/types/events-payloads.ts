import { GpuDevice, TransactionInfo, WalletBalance } from './app-status';
import { BasePoolData, ConfigPools, CpuPools, GpuPools } from './configs';

export enum SetupPhase {
    Core = 'Core',
    Wallet = 'Wallet',
    Hardware = 'Hardware',
    Node = 'Node',
    Mining = 'Mining',
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

export type ConnectedPeersUpdatePayload = string[];

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
      };

export type ConnectionStatusPayload = 'InProgress' | 'Succeed' | 'Failed';

export interface ConfigPoolsPayload extends Omit<ConfigPools, 'available_gpu_pools' | 'available_cpu_pools'> {
    available_gpu_pools?: [{ [GpuPools.LuckyPool]: BasePoolData }, { [GpuPools.SupportXTMPool]: BasePoolData }]; // Available GPU pools
    available_cpu_pools?: [{ [CpuPools.LuckyPool]: BasePoolData }, { [CpuPools.SupportXTMPool]: BasePoolData }]; // Available CPU pools
}
