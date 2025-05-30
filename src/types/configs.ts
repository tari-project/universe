import { modeType } from '@app/store';
import { GpuThreads } from './app-status';
import { NodeType } from '@app/store/useNodeStore';

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
    default_chain: number;
}
export interface ConfigWallet {
    created_at: string;
    monero_address: string;
    monero_address_is_generated: boolean;
    keyring_accessed: boolean;
}
export interface ConfigUI {
    created_at: string;
    display_mode: string;
    has_system_language_been_proposed: boolean;
    should_always_use_system_language: boolean;
    application_language: string;
    paper_wallet_enabled: boolean;
    custom_power_levels_enabled: boolean;
    sharing_enabled: boolean;
    visual_mode: boolean;
    show_experimental_settings: boolean;
    warmup_seen: boolean | null;
}
export interface ConfigMining {
    created_at: string;
    mode: modeType;
    eco_mode_cpu_threads: number;
    mine_on_app_start: boolean;
    ludicrous_mode_cpu_threads: number;
    eco_mode_cpu_options: string[];
    ludicrous_mode_cpu_options: string[];
    custom_mode_cpu_options: string[];
    custom_max_cpu_usage: number;
    custom_max_gpu_usage: GpuThreads[];
    gpu_mining_enabled: boolean;
    cpu_mining_enabled: boolean;
    gpu_engine: string;
    mining_time: number;
}

export interface ConfigBackendInMemory {
    airdropUrl: string;
    airdropApiUrl: string;
    airdropTwitterAuthUrl: string;
    exchangeId?: string;
    isUniversalMiner?: boolean;
    walletConnectProjectId?: string;
}
