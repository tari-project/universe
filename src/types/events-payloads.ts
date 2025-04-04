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

export interface ResumingAllProcessesPayload {
    title: string;
    stage_progress: number;
    stage_total: number;
    is_resuming: boolean;
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
