import { create } from 'zustand';
import {
    ConfigBackendInMemory,
    ConfigCore,
    ConfigMining,
    ConfigMiningSelectors,
    ConfigPools,
    ConfigPoolsSelectors,
    ConfigUI,
    ConfigWallet,
} from '@app/types/configs';
import { WalletUIMode } from '@app/types/events-payloads';

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
    gpu_engine: '',
    gpu_mining_enabled: true,
    mine_on_app_start: false,
    mining_modes: {},
    selected_mining_mode: 'Eco',
};

const configUIInitialState: UIConfigStoreState = {
    visualModeToggleLoading: false,
    created_at: '',
    application_language: 'en',
    display_mode: 'Eco',
    has_system_language_been_proposed: false,
    sharing_enabled: true,
    show_experimental_settings: false,
    should_always_use_system_language: false,
    visual_mode: true,
    wallet_ui_mode: WalletUIMode.Standard,
    was_staged_security_modal_shown: false,
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

export const useConfigMiningStore = create<ConfigMining & ConfigMiningSelectors>()((_, get) => ({
    ...configMininigInitialState,
    getSelectedMiningMode: () => get().mining_modes[get().selected_mining_mode] || undefined,
}));

export const useConfigUIStore = create<UIConfigStoreState>()(() => ({
    ...configUIInitialState,
}));

export const useConfigPoolsStore = create<ConfigPools & ConfigPoolsSelectors>()((_, get) => ({
    ...configPoolsInitialState,
    getCpuPool: () => {
        const cpuPool = get().cpu_pool;
        if (cpuPool) {
            return Object.values(cpuPool)[0];
        }
        return undefined;
    },
    getGpuPool: () => {
        const gpuPool = get().gpu_pool;
        if (gpuPool) {
            return Object.values(gpuPool)[0];
        }
        return undefined;
    },
}));

export const useConfigBEInMemoryStore = create<ConfigBackendInMemory>()(() => ({
    ...configBEInMemoryInitialState,
}));
