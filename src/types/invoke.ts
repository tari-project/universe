import { modeType } from '@app/store/types';
import { AppConfig, ApplicationsVersions, MinerMetrics, P2poolStatsResult, TariWalletDetails } from './app-status';
import { Language } from '@app/i18initializer';
//should_always_use_system_language
declare module '@tauri-apps/api/tauri' {
    function invoke(
        param: 'set_should_always_use_system_language',
        payload: { shouldAlwaysUseSystemLanguage: boolean }
    ): Promise<void>;
    function invoke(param: 'set_application_language', payload: { applicationLanguage: Language }): Promise<void>;
    function invoke(param: 'resolve_application_language'): Promise<Language>;
    function invoke(param: 'setup_application'): Promise<boolean>;
    function invoke(param: 'open_log_dir'): Promise<void>;
    function invoke(param: 'start_mining'): Promise<void>;
    function invoke(param: 'stop_mining'): Promise<void>;
    function invoke(param: 'set_allow_telemetry', payload: { allow_telemetry: boolean }): Promise<void>;
    function invoke(param: 'set_auto_mining', payload: { autoMining: boolean }): Promise<void>;
    function invoke(param: 'set_user_inactivity_timeout', payload: { timeout: number }): Promise<void>;
    function invoke(param: 'update_applications'): Promise<void>;
    function invoke(param: 'set_mode', payload: { mode: modeType }): Promise<void>;
    function invoke(param: 'get_seed_words'): Promise<string[]>;
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
    function invoke(param: 'set_cpu_mining_enabled', payload: { enabled: boolean }): Promise<void>;
    function invoke(param: 'exit_application'): Promise<string>;
    function invoke(
        param: 'log_web_message',
        payload: { level: 'log' | 'error' | 'warn' | 'info'; message: string }
    ): Promise<ApplicationsVersions>;
}
