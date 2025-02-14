import { create } from './create';
import { AppConfig } from '../types/app-status.ts';

type AppConfigStoreState = Partial<AppConfig>;
const initialState: AppConfigStoreState = {
    config_version: 0,
    config_file: undefined,
    mode: 'Eco',
    mine_on_app_start: false,
    p2pool_enabled: false,
    last_binaries_update_timestamp: '0',
    allow_telemetry: false,
    anon_id: '',
    monero_address: '',
    gpu_mining_enabled: true,
    cpu_mining_enabled: true,
    sharing_enabled: true,
    paper_wallet_enabled: true,
    custom_power_levels_enabled: true,
    use_tor: true,
    auto_update: false,
    monero_address_is_generated: false,
    mmproxy_use_monero_fail: false,
    mmproxy_monero_nodes: ['https://xmr-01.tari.com'],
    visual_mode: true,
    custom_max_cpu_usage: undefined,
    custom_max_gpu_usage: [],
    show_experimental_settings: false,
    p2pool_stats_server_port: null,
    pre_release: false,
    airdrop_tokens: undefined,
};
export const useAppConfigStore = create<AppConfigStoreState>()(() => ({
    ...initialState,
}));
