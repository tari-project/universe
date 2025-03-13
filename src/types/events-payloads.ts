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

export interface SetupStatusPayload {
    event_type: string;
    title: string;
    title_params?: Record<string, string>;
    progress: number;
}

export interface ResumingAllProcessesPayload {
    title: string;
    stage_progress: number;
    stage_total: number;
    is_resuming: boolean;
}

export type ConnectedPeersUpdatePayload = string[];
