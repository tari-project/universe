import {
    ApplicationsVersions,
    TorConfig,
    TransactionInfo,
    BridgeEnvs,
    TariAddressVariants,
    BaseNodeStatus,
} from './app-status';
import { Language } from '@app/i18initializer';
import { PaperWalletDetails } from '@app/types/app-status.ts';
import { displayMode } from '@app/store/types.ts';
import { BasePoolData, ConfigBackendInMemory, PauseOnBatteryModeState } from '@app/types/configs.ts';
import { ExchangeMiner } from './exchange';
import { ActiveTapplet } from '@app/types/tapplets/tapplet.types';

declare module '@tauri-apps/api/core' {
    function invoke(
        param: 'send_one_sided_to_stealth_address',
        payload: { amount: string; destination: string; paymentId?: string }
    ): Promise<void>;
    function invoke(
        param: 'set_should_always_use_system_language',
        payload: { shouldAlwaysUseSystemLanguage: boolean }
    ): Promise<void>;
    function invoke(param: 'set_should_auto_launch', payload: { shouldAutoLaunch: boolean }): Promise<void>;
    function invoke(param: 'set_selected_engine', payload: { selectedEngine: string }): Promise<void>;
    function invoke(param: 'set_application_language', payload: { applicationLanguage: Language }): Promise<void>;
    function invoke(param: 'frontend_ready'): Promise<void>;
    function invoke(param: 'download_and_start_installer', payload: { id: string }): Promise<void>;
    function invoke(param: 'get_paper_wallet_details', payload?: { authUuid?: string }): Promise<PaperWalletDetails>;
    function invoke(param: 'set_mine_on_app_start', payload: { mineOnAppStart: boolean }): Promise<void>;
    function invoke(param: 'open_log_dir'): Promise<void>;
    function invoke(param: 'start_cpu_mining'): Promise<void>;
    function invoke(param: 'start_gpu_mining'): Promise<void>;
    function invoke(param: 'stop_cpu_mining'): Promise<void>;
    function invoke(param: 'stop_gpu_mining'): Promise<void>;
    function invoke(param: 'set_allow_telemetry', payload: { allow_telemetry: boolean }): Promise<void>;
    function invoke(param: 'select_mining_mode', payload: { mode: string }): Promise<void>;
    function invoke(
        param: 'update_custom_mining_mode',
        payload: {
            customCpuUsage: number;
            customGpuUsage: number;
        }
    ): Promise<void>;
    function invoke(param: 'set_display_mode', payload: { displayMode: displayMode }): Promise<void>;
    function invoke(param: 'get_seed_words'): Promise<string[]>;
    function invoke(param: 'revert_to_internal_wallet'): Promise<void>;
    function invoke(param: 'get_monero_seed_words'): Promise<string[]>;
    function invoke(param: 'get_applications_versions'): Promise<ApplicationsVersions>;
    function invoke(param: 'set_monero_address', payload: { moneroAddress: string }): Promise<void>;
    function invoke(param: 'send_feedback', payload: { feedback: string; includeLogs: boolean }): Promise<string>;
    function invoke(param: 'reset_settings', payload: { resetWallet: boolean }): Promise<string>;
    function invoke(param: 'set_gpu_mining_enabled', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'set_cpu_mining_enabled', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'exit_application'): Promise<string>;
    function invoke(param: 'restart_application'): Promise<string>;
    function invoke(param: 'set_use_tor', payload: { useTor: boolean }): Promise<void>;
    function invoke(
        param: 'get_transactions',
        payload: { offset?: number; limit?: number; statusBitflag?: number }
    ): Promise<TransactionInfo[]>;
    function invoke(param: 'import_seed_words', payload: { seedWords: string[] }): Promise<void>;
    function invoke(param: 'get_tor_config'): Promise<TorConfig>;
    function invoke(param: 'set_tor_config', payload: { config: TorConfig }): Promise<TorConfig>;
    function invoke(param: 'fetch_tor_bridges'): Promise<string[]>;
    function invoke(param: 'start_mining_status'): Promise<string[]>;
    function invoke(param: 'stop_mining_status'): Promise<string[]>;
    function invoke(param: 'set_visual_mode', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'set_pre_release', payload: { preRelease: boolean }): Promise<void>;
    function invoke(param: 'proceed_with_update'): Promise<void>;
    function invoke(
        param: 'set_airdrop_tokens',
        airdropTokens: { token: string; refresh_token: string }
    ): Promise<void>;
    function invoke(param: 'get_airdrop_tokens'): Promise<{ refresh_token: string; token: string }>;
    function invoke(
        param: 'toggle_device_exclusion',
        payload: { device_index: number; excluded: boolean }
    ): Promise<void>;
    function invoke(
        param: 'set_show_experimental_settings',
        payload: { showExperimentalSettings: boolean }
    ): Promise<void>;
    function invoke(param: 'websocket_connect'): Promise<void>;
    function invoke(param: 'websocket_close'): Promise<void>;
    function invoke(
        param: 'set_monerod_config',
        payload: {
            useMoneroFail: boolean;
            moneroNodes: string[];
        }
    ): Promise<void>;
    function invoke(
        param: 'log_web_message',
        payload: { level: 'log' | 'error' | 'warn' | 'info'; message: string }
    ): Promise<ApplicationsVersions>;
    function invoke(param: 'reconnect'): Promise<void>;
    function invoke(
        param: 'verify_address_for_send',
        payload: { address: string; sendingMethod?: number }
    ): Promise<void>;
    function invoke(param: 'validate_minotari_amount', payload: { amount: string }): Promise<string>;
    function invoke(param: 'trigger_phases_restart'): Promise<void>;
    function invoke(param: 'set_node_type', payload: { nodeType: NodeType }): Promise<void>;
    function invoke(param: 'set_external_tari_address', payload: { address: string }): Promise<void>;
    function invoke(param: 'confirm_exchange_address', payload: { address: string }): Promise<void>;
    function invoke(param: 'get_app_in_memory_config'): Promise<ConfigBackendInMemory>;
    function invoke(
        param: 'select_exchange_miner',
        payload: { exchangeMiner: ExchangeMiner; miningAddress: string }
    ): Promise<void>;
    function invoke(param: 'launch_builtin_tapplet'): Promise<ActiveTapplet>;
    function invoke(param: 'get_bridge_envs'): Promise<BridgeEnvs>;
    function invoke(param: 'parse_tari_address', payload: { address: string }): Promise<TariAddressVariants>;
    function invoke(param: 'refresh_wallet_history'): Promise<void>;
    function invoke(param: 'get_base_node_status'): Promise<BaseNodeStatus>;
    function invoke(param: 'create_pin'): Promise<void>;
    function invoke(param: 'forgot_pin', payload: { seedWords: string[] }): Promise<void>;
    function invoke(param: 'toggle_cpu_pool_mining', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'toggle_gpu_pool_mining', payload: { enabled: boolean }): Promise<void>;
    function invoke(
        param: 'encode_payment_id_to_address',
        payload: { paymentId: string; tariAddress: string }
    ): Promise<string>;
    function invoke(param: 'save_wxtm_address', payload: { address: string; exchangeId: string }): Promise<void>;
    function invoke(param: 'change_cpu_pool', payload: { cpuPool: string }): Promise<void>;
    function invoke(param: 'change_gpu_pool', payload: { gpuPool: string }): Promise<void>;
    function invoke(param: 'update_selected_cpu_pool', payload: { updated_config: BasePoolData }): Promise<void>;
    function invoke(param: 'update_selected_gpu_pool', payload: { updated_config: BasePoolData }): Promise<void>;
    function invoke(param: 'reset_gpu_pool_config', payload: { gpuPoolType: string }): Promise<void>;
    function invoke(param: 'reset_cpu_pool_config', payload: { cpuPoolType: string }): Promise<void>;
    function invoke(param: 'restart_phases', payload: { phases: SetupPhase[] }): Promise<void>;
    function invoke(param: 'list_connected_peers'): Promise<string[]>;
    function invoke(param: 'switch_gpu_miner', payload: { gpuMinerType: GpuMinerType }): Promise<void>;
    function invoke(param: 'set_feedback_fields', payload: { feedbackType: string; wasSent: boolean }): Promise<void>;
    function invoke(param: 'set_mode_mining_time', payload: { mode: string; duration: number }): Promise<void>;
    function invoke(param: 'set_eco_alert_needed'): Promise<void>;
    function invoke(param: 'set_pause_on_battery_mode', payload: { mode: PauseOnBatteryModeState }): Promise<void>;
}
