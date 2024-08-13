import { modeType } from '../store/types';

export interface AppStatus {
    cpu?: CpuMinerStatus;
    gpu?: GpuMinerStatus;
    base_node?: BaseNodeStatus;
    wallet_balance?: WalletBalance;
    applications_versions?: ApplicationsVersions;
    main_app_version?: string;
    mode: modeType;
    auto_mining: boolean;
}

export interface GpuMinerStatus {
    hardware_statuses: GpuMinerHardwareStatus[];
}

export interface GpuMinerHardwareStatus {
    uuid: string;
    temperature: number;
    max_temperature: number;
    name: string;
    load: number;
}
export interface CpuCoreTemperature {
    label: string;
    temperature: number;
    max_temperature: number;
}

export interface CpuMinerStatus {
    is_mining: boolean;
    hash_rate: number;
    cpu_usage: number;
    cpu_brand: string;
    cpu_temperatures: CpuCoreTemperature[];
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
