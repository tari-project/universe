import { NodeType } from '@app/store/useNodeStore';
import { WalletUIMode } from './events-payloads';

export interface ConfigCore {
    created_at: string;
    use_tor: boolean;
    allow_telemetry: boolean;
    allow_notifications: boolean;
    last_binaries_update_timestamp?: string;
    anon_id: string;
    should_auto_launch: boolean;
    mmproxy_use_monero_failover: boolean;
    mmproxy_monero_nodes: string[];
    auto_update: boolean;
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
    wxtm_addresses: Record<string, string>; // Ethereum addresses used for WXTm mode
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
    feedback?: FeedbackPrompts;
}

export interface FeedbackPrompt {
    feedback_sent: boolean;
    last_dismissed: {
        secs_since_epoch?: number;
        nanos_since_epoch?: number;
    } | null;
}

export type PromptType = 'long_time_miner' | 'early_close';
export type FeedbackPrompts = Partial<Record<PromptType, FeedbackPrompt>>;

export type MiningModes = Record<MiningModeType, MiningMode>;

export interface ConfigMining {
    created_at: string;
    mine_on_app_start: boolean;
    selected_mining_mode: string;
    gpu_mining_enabled: boolean;
    mining_modes: MiningModes | Record<string, MiningMode>;
    gpu_devices_settings: Record<number, GpuDeviceSettings>;
    cpu_mining_enabled: boolean;
    gpu_engine: string;
    is_gpu_mining_recommended: boolean;
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
    Turbo = 'Turbo',
    Ludicrous = 'Ludicrous',
    Custom = 'Custom',
    User = 'User',
}

export interface MiningMode {
    mode_type: MiningModeType;
    mode_name: string;
    cpu_usage_percentage: number;
    gpu_usage_percentage: number;
}

export interface ConfigPools {
    // ======= Config internals =======
    was_config_migrated: boolean;
    created_at: string;
    // ======= Gpu Pool =======
    // When false we are solo mining with glytex, if true we are pool mining with graxil
    gpu_pool_enabled: boolean; // Whether GPU pool mining is enabled | defaults to true
    selected_gpu_pool?: string; // Name of the selected GPU pool => defaults to LuckyPool
    available_gpu_pools?: Record<GpuPools, BasePoolData>; // Available GPU pools
    // ======= Cpu Pool =======
    // When false we are solo mining with xmrig and mmproxy if true we are pool mining with xmrig
    cpu_pool_enabled: boolean; // Whether CPU pool mining is enabled | defaults to true
    selected_cpu_pool?: string; // Name of the selected CPU pool => defaults to LuckyPool
    available_cpu_pools?: Record<CpuPools, BasePoolData>; // Available CPU pools
}

export enum GpuPools {
    LuckyPool = 'LuckyPool',
    SupportXTMPool = 'SupportXTMPool',
}

export enum CpuPools {
    LuckyPool = 'LuckyPool',
    SupportXTMPool = 'SupportXTMPool',
}

export interface BasePoolData {
    pool_url: string;
    stats_url: string;
    pool_name: string;
}

export interface ConfigBackendInMemory {
    airdrop_url: string;
    airdrop_api_url: string;
    airdrop_twitter_auth_url: string;
    exchange_id: string;
    bridge_backend_api_url: string;
}
