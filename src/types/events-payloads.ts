import { GpuDevice, TransactionInfo, WalletBalance } from './app-status';

export interface WalletAddressUpdatePayload {
    tari_address_base58: string;
    tari_address_emoji: string;
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
        public_address: string[];
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
