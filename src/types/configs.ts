import { NodeType } from '@app/store/useNodeStore';
import { WalletUIMode } from './events-payloads';

export interface ConfigCore {
    created_at: string;
    is_p2pool_enabled: boolean;
    use_tor: boolean;
    allow_telemetry: boolean;
    allow_notifications: boolean;
    last_binaries_update_timestamp?: string;
    anon_id: string;
    should_auto_launch: boolean;
    mmproxy_use_monero_failover: boolean;
    mmproxy_monero_nodes: string[];
    auto_update: boolean;
    p2pool_stats_server_port?: number;
    pre_release: boolean;
    last_changelog_version: string;
    airdrop_tokens?: {
        token: string;
        refreshToken: string;
    };
    remote_base_node_address: string;
    node_type?: NodeType;
    exchange_id?: string;
}
export interface ConfigWallet {
    created_at: string;
    monero_address: string;
    monero_address_is_generated: boolean;
    keyring_accessed: boolean;
    last_known_balance?: number;
}
export interface ConfigUI {
    created_at: string;
    display_mode: string;
    has_system_language_been_proposed: boolean;
    should_always_use_system_language: boolean;
    application_language: string;
    sharing_enabled: boolean;
    visual_mode: boolean;
    show_experimental_settings: boolean;
    wallet_ui_mode: WalletUIMode;
    was_staged_security_modal_shown: boolean;
    show_ootle_settings: boolean;
}

export interface ConfigMining {
    created_at: string;
    mine_on_app_start: boolean;
    selected_mining_mode: string;
    gpu_mining_enabled: boolean;
    mining_modes: Record<string, MiningMode>;
    gpu_devices_settings: Record<number, GpuDeviceSettings>;
    cpu_mining_enabled: boolean;
    gpu_engine: string;
}

export interface ConfigMiningSelectors {
    getSelectedMiningMode: () => MiningMode | undefined;
}

export interface GpuDeviceSettings {
    device_id: number;
    is_excluded: boolean;
}

export enum MiningModeType {
    Eco = 'Eco',
    Custom = 'Custom',
    Ludicrous = 'Ludicrous',
    User = 'User',
}

export interface MiningMode {
    mode_type: MiningModeType;
    mode_name: string;
    cpu_usage_percentage: number;
    gpu_usage_percentage: number;
}
export interface ConfigPools {
    was_config_migrated: boolean;
    created_at: string;
    gpu_pool_enabled: boolean;
    gpu_pool?: { [GpuPools.LuckyPool]: BasePoolData } | { [GpuPools.SupportXTMPool]: BasePoolData };
    cpu_pool_enabled: boolean;
    cpu_pool?: { [CpuPools.GlobalTariPool]: BasePoolData };
}

export interface ConfigPoolsSelectors {
    getGpuPool: () => BasePoolData | undefined;
    getCpuPool: () => BasePoolData | undefined;
}

export enum GpuPools {
    LuckyPool = 'LuckyPool',
    SupportXTMPool = 'SupportXTMPool',
}

export enum CpuPools {
    GlobalTariPool = 'GlobalTariPool',
}

export interface BasePoolData {
    pool_url: string;
    stats_url: string;
    pool_name: string;
}
export interface ConfigPools {
    was_config_migrated: boolean;
    created_at: string;
    gpu_pool_enabled: boolean;
    gpu_pool?: { [GpuPools.LuckyPool]: BasePoolData } | { [GpuPools.SupportXTMPool]: BasePoolData };
    cpu_pool_enabled: boolean;
    cpu_pool?: { [CpuPools.GlobalTariPool]: BasePoolData };
}

export interface ConfigBackendInMemory {
    airdropUrl: string;
    airdropApiUrl: string;
    airdropTwitterAuthUrl: string;
    exchangeId: string;
    bridgeBackendApiUrl: string;
    walletConnectProjectId?: string;
}
