import { create } from 'zustand';
import {
    ConfigBackendInMemory,
    ConfigCore,
    ConfigMining,
    ConfigPools,
    ConfigPoolsSelectors,
    ConfigUI,
    ConfigWallet,
} from '@app/types/configs';

type UIConfigStoreState = Partial<ConfigUI> & {
    visualModeToggleLoading: boolean;
};
const configCoreInitialState: ConfigCore = {
    created_at: '',
    allow_telemetry: false,
    allow_notifications: true,
    anon_id: '',
    auto_update: false,
    is_p2pool_enabled: false,
    last_changelog_version: '',
    mmproxy_monero_nodes: [],
    mmproxy_use_monero_failover: false,
    pre_release: false,
    remote_base_node_address: '',
    should_auto_launch: false,
    use_tor: false,
    airdrop_tokens: undefined,
    last_binaries_update_timestamp: '',
    p2pool_stats_server_port: undefined,
    exchange_id: undefined,
};

const configWalletInitialState: ConfigWallet = {
    created_at: '',
    keyring_accessed: false,
    monero_address: '',
    monero_address_is_generated: false,
};

const configMininigInitialState: ConfigMining = {
    created_at: '',
    cpu_mining_enabled: true,
    custom_max_cpu_usage: 2,
    custom_mode_cpu_options: [],
    custom_max_gpu_usage: [],
    eco_mode_cpu_threads: 0,
    eco_mode_cpu_options: [],
    eco_mode_max_cpu_usage: 2,
    eco_mode_max_gpu_usage: [],
    gpu_engine: '',
    gpu_mining_enabled: true,
    ludicrous_mode_cpu_threads: 0,
    ludicrous_mode_cpu_options: [],
    ludicrous_mode_max_cpu_usage: 2,
    ludicrous_mode_max_gpu_usage: [],
    mine_on_app_start: false,
    mode: 'Eco',
    mining_time: 0,
};

const configUIInitialState: UIConfigStoreState = {
    visualModeToggleLoading: false,
    created_at: '',
    application_language: 'en',
    custom_power_levels_enabled: true,
    display_mode: 'Eco',
    has_system_language_been_proposed: false,
    paper_wallet_enabled: true,
    sharing_enabled: true,
    show_experimental_settings: false,
    should_always_use_system_language: false,
    visual_mode: true,
    warmup_seen: null,
};

const configPoolsInitialState: ConfigPools = {
    was_config_migrated: false,
    created_at: '',
    cpu_pool_enabled: false,
    gpu_pool_enabled: false,
};

const configBEInMemoryInitialState: ConfigBackendInMemory = {
    airdropUrl: '',
    airdropApiUrl: '',
    airdropTwitterAuthUrl: '',
    exchangeId: '',
    bridgeBackendApiUrl: '',
};

export const useConfigCoreStore = create<ConfigCore>()(() => ({
    ...configCoreInitialState,
}));

export const useConfigWalletStore = create<ConfigWallet>()(() => ({
    ...configWalletInitialState,
}));

export const useConfigMiningStore = create<ConfigMining>()(() => configMininigInitialState);

export const useConfigUIStore = create<UIConfigStoreState>()(() => ({
    ...configUIInitialState,
}));

export const useConfigPoolsStore = create<ConfigPools & ConfigPoolsSelectors>()((_, get) => ({
    ...configPoolsInitialState,
    getGpuPool: () => {
        const gpuPool = get().gpu_pool;
        return gpuPool ? Object.values(gpuPool)[0] : undefined;
    },
    getCpuPool: () => {
        const cpuPool = get().cpu_pool;
        return cpuPool ? Object.values(cpuPool)[0] : undefined;
    },
}));

export const useConfigBEInMemoryStore = create<ConfigBackendInMemory>()(() => ({
    ...configBEInMemoryInitialState,
}));
