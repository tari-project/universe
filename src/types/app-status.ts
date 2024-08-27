import { modeType } from '../store/types';

export interface AppStatus {
    cpu?: CpuMinerStatus;
    base_node?: BaseNodeStatus;
    hardware_status?: HardwareStatus;
    wallet_balance?: WalletBalance;
    applications_versions?: ApplicationsVersions;
    main_app_version?: string;
    user_inactivity_timeout?: number;
    current_user_inactivity_duration?: number;
    mode: modeType;
    auto_mining: boolean;
}

export interface HardwareParameters {
    label: string;
    usage_percentage: number;
    current_temperature: number;
    max_temperature: number;
}

export interface HardwareStatus {
    cpu: HardwareParameters;
    gpu: HardwareParameters;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    estimated_earnings: number;
    connection: CpuMinerConnectionStatus;
}
export interface CpuMinerConnectionStatus {
    is_connected: boolean;
}

export interface BaseNodeStatus {
    block_height: number;
    block_time: number;
    is_synced: boolean;
}

export interface WalletBalance {
    available_balance?: number;
    timelocked_balance?: number;
    pending_incoming_balance?: number;
    pending_outgoing_balance?: number;
}

export interface ApplicationsVersions {
    xmrig: string;
    minotari_node: string;
    mm_proxy: string;
    wallet: string;
}
