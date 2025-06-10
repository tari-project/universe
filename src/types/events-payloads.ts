import { GpuDevice, TransactionInfo, WalletBalance } from './app-status';

export interface WalletAddressUpdatePayload {
    tari_address_base58: string;
    tari_address_emoji: string;
    is_tari_address_generated: boolean;
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

export interface SnakeCaseAppInMemoryConfig {
    airdrop_url: string;
    airdrop_api_url: string;
    airdrop_twitter_auth_url: string;
    bridge_backend_api_url: string;
    wallet_connect_project_id: string;
    exchange_id: string;
}
export interface AppInMemoryConfigChangedPayload {
    app_in_memory_config: SnakeCaseAppInMemoryConfig;
    is_universal_exchange: boolean;
}
export type ConnectionStatusPayload = 'InProgress' | 'Succeed' | 'Failed';
