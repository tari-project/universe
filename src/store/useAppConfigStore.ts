import {
    ConfigCore,
    ConfigMining,
    ConfigPortal,
    ConfigUI,
    ConfigWallet,
    EthereumChainConfig,
} from '@app/types/configs';
import { create } from './create';

type UIConfigStoreState = Partial<ConfigUI> & {
    visualModeToggleLoading: boolean;
};
const configCoreInitialState: ConfigCore = {
    created_at: '',
    allow_telemetry: false,
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
    custom_max_cpu_usage: 0,
    custom_mode_cpu_options: [],
    custom_max_gpu_usage: [],
    eco_mode_cpu_threads: 0,
    eco_mode_cpu_options: [],
    gpu_engine: '',
    gpu_mining_enabled: true,
    ludicrous_mode_cpu_threads: 0,
    ludicrous_mode_cpu_options: [],
    mine_on_app_start: false,
    mode: 'Eco',
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
};

const emptyEthereumConfig: EthereumChainConfig = {
    id: 0,
    name: '',
    native_currency: {
        decimals: 0,
        name: '',
        symbol: '',
    },
    rpc_urls: {
        http: '',
        websocket: '',
    },
};
const configPortalInitialState: ConfigPortal = {
    created_at: '',
    id: '',
    level_db_name: '',
    portal: emptyEthereumConfig,
    native_chains: {
        ethereum: emptyEthereumConfig,
        lightning: {
            hub_id: '',
            hub_socket: '',
            url: '',
            path_tls_cert: '',
            path_macaroon: '',
        },
    },
};

export const useConfigCoreStore = create<ConfigCore>()(() => ({
    ...configCoreInitialState,
}));

export const useConfigWalletStore = create<ConfigWallet>()(() => ({
    ...configWalletInitialState,
}));

export const useConfigMiningStore = create<ConfigMining>()(() => ({
    ...configMininigInitialState,
}));

export const useConfigUIStore = create<UIConfigStoreState>()(() => ({
    ...configUIInitialState,
}));

export const useConfigPortalStore = create<ConfigPortal>()(() => ({
    ...configPortalInitialState,
}));
