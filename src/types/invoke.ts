import {
    AppConfig,
    ApplicationsVersions,
    ExternalDependency,
    MinerMetrics,
    P2poolStatsResult,
    TariWalletDetails,
    TorConfig,
    TransactionInfo,
    MaxConsumptionLevels,
    GpuThreads,
} from './app-status';
import { Language } from '@app/i18initializer';
import { PaperWalletDetails } from '@app/types/app-status.ts';
import { displayMode, modeType } from '@app/store/types.ts';
import {
    DevTapplet,
    InstalledTapplet,
    InstalledTappletWithAssets,
    RegisteredTapplet,
    RegisteredTappletWithAssets,
} from './ootle/tapplet';
import { AccountsGetBalancesResponse } from '@tari-project/wallet_jrpc_client';

declare module '@tauri-apps/api/tauri' {
    function invoke(
        param: 'set_should_always_use_system_language',
        payload: { shouldAlwaysUseSystemLanguage: boolean }
    ): Promise<void>;
    function invoke(param: 'set_should_auto_launch', payload: { shouldAutoLaunch: boolean }): Promise<void>;
    function invoke(param: 'set_application_language', payload: { applicationLanguage: Language }): Promise<void>;
    function invoke(
        param: 'download_and_start_installer',
        payload: { missingDependency: ExternalDependency }
    ): Promise<void>;
    function invoke(param: 'get_external_dependencies'): Promise<ExternalDependency[]>;
    function invoke(param: 'get_paper_wallet_details'): Promise<PaperWalletDetails>;
    function invoke(param: 'resolve_application_language'): Promise<Language>;
    function invoke(param: 'set_mine_on_app_start', payload: { mineOnAppStart: boolean }): Promise<void>;
    function invoke(param: 'setup_application'): Promise<boolean>;
    function invoke(param: 'open_log_dir'): Promise<void>;
    function invoke(param: 'start_mining'): Promise<void>;
    function invoke(param: 'stop_mining'): Promise<void>;
    function invoke(param: 'set_allow_telemetry', payload: { allow_telemetry: boolean }): Promise<void>;
    function invoke(param: 'set_user_inactivity_timeout', payload: { timeout: number }): Promise<void>;
    function invoke(param: 'update_applications'): Promise<void>;
    function invoke(
        param: 'set_mode',
        payload: { mode: modeType; customCpuUsage: number; customGpuUsage: GpuThreads[] }
    ): Promise<void>;
    function invoke(param: 'get_max_consumption_levels'): Promise<MaxConsumptionLevels>;
    function invoke(param: 'set_display_mode', payload: { displayMode: displayMode }): Promise<void>;
    function invoke(param: 'get_seed_words'): Promise<string[]>;
    function invoke(param: 'get_monero_seed_words'): Promise<string[]>;
    function invoke(param: 'get_applications_versions'): Promise<ApplicationsVersions>;
    function invoke(param: 'set_monero_address', payload: { moneroAddress: string }): Promise<void>;
    function invoke(param: 'send_feedback', payload: { feedback: string; includeLogs: boolean }): Promise<string>;
    function invoke(param: 'reset_settings', payload: { resetWallet: boolean }): Promise<string>;
    function invoke(param: 'get_app_config'): Promise<AppConfig>;
    function invoke(param: 'set_p2pool_enabled', payload: { p2pool_enabled: boolean }): Promise<void>;
    function invoke(param: 'get_p2pool_stats'): Promise<P2poolStatsResult>;
    function invoke(param: 'get_tari_wallet_details'): Promise<TariWalletDetails>;
    function invoke(param: 'get_miner_metrics'): Promise<MinerMetrics>;
    function invoke(param: 'set_gpu_mining_enabled', payload: { enabled: boolean }): Promise<void>;
    function invoke(
        param: 'set_excluded_gpu_devices',
        payload: { excludedGpuDevice: number | undefined }
    ): Promise<void>;
    function invoke(param: 'set_cpu_mining_enabled', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'exit_application'): Promise<string>;
    function invoke(param: 'restart_application', payload: { shouldStopMiners: boolean }): Promise<string>;
    function invoke(param: 'set_use_tor', payload: { useTor: boolean }): Promise<void>;
    function invoke(param: 'get_transaction_history'): Promise<TransactionInfo[]>;
    function invoke(param: 'import_seed_words', payload: { seedWords: string[] }): Promise<void>;
    function invoke(param: 'get_tor_config'): Promise<TorConfig>;
    function invoke(param: 'set_tor_config', payload: { config: TorConfig }): Promise<TorConfig>;
    function invoke(param: 'fetch_tor_bridges'): Promise<string[]>;
    function invoke(param: 'get_tor_entry_guards'): Promise<string[]>;
    function invoke(param: 'set_visual_mode', payload: { enabled: boolean }): Promise<void>;
    function invoke(
        param: 'set_show_experimental_settings',
        payload: { showExperimentalSettings: boolean }
    ): Promise<void>;
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

    /**
     * Tati Ootle
     */
    function invoke(param: 'read_installed_tapp_db'): Promise<InstalledTappletWithAssets[]>;
    function invoke(param: 'read_dev_tapplets'): Promise<DevTapplet[]>;
    function invoke(param: 'read_tapp_registry_db'): Promise<RegisteredTapplet[]>;
    function invoke(
        param: 'update_tapp',
        payload: { tappletId: string; installedTappletId: string }
    ): Promise<InstalledTappletWithAssets[]>;
    //TODO add payload type
    // function invoke(param: 'get_balances', payload: {}): Promise<AccountsGetBalancesResponse>;
    function invoke(param: 'get_assets_server_addr'): Promise<string>;
    function invoke(param: 'add_dev_tapplet', payload: { endpoint: string }): Promise<DevTapplet>;
    function invoke(param: 'insert_installed_tapp_db', payload: { tappletId: string }): Promise<InstalledTapplet>;
    function invoke(
        param: 'download_and_extract_tapp',
        payload: { tappletId: string }
    ): Promise<RegisteredTappletWithAssets>;
}
