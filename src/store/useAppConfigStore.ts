import { create } from 'zustand';
import {
    ConfigBackendInMemory,
    ConfigMining,
    ConfigMiningSelectors,
    ConfigPools,
    ConfigUI,
    ConfigWallet,
} from '@app/types/configs';
import { WalletUIMode } from '@app/types/events-payloads';

type UIConfigStoreState = Partial<ConfigUI> & {
    visualModeToggleLoading: boolean;
};

const configWalletInitialState: ConfigWallet = {
    created_at: '',
    keyring_accessed: false,
    monero_address: '',
    monero_address_is_generated: false,
    wxtm_addresses: {},
};

const configMininigInitialState: ConfigMining = {
    created_at: '',
    cpu_mining_enabled: true,
    gpu_engine: '',
    gpu_mining_enabled: true,
    mine_on_app_start: false,
    mining_modes: {},
    selected_mining_mode: 'Eco',
    gpu_devices_settings: {},
    is_gpu_mining_recommended: true,
    eco_alert_needed: false,
};

const configUIInitialState: UIConfigStoreState = {
    visualModeToggleLoading: false,
    created_at: '',
    application_language: 'en',
    display_mode: 'system',
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
    cpu_pools: undefined,
    gpu_pools: undefined,
    current_cpu_pool: undefined,
    current_gpu_pool: undefined,
};

const configBEInMemoryInitialState: ConfigBackendInMemory = {
    airdrop_url: '',
    airdrop_api_url: '',
    airdrop_twitter_auth_url: '',
    exchange_id: '',
    bridge_backend_api_url: '',
};

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

export const useConfigPoolsStore = create<ConfigPools>()(() => ({
    ...configPoolsInitialState,
}));

export const useConfigBEInMemoryStore = create<ConfigBackendInMemory>()(() => ({
    ...configBEInMemoryInitialState,
}));
