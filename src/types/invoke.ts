import { modeType } from '@app/store/types';
import { ApplicationsVersions, AppStatus } from './app-status';

declare module '@tauri-apps/api/tauri' {
    function invoke(param: 'setup_application'): Promise<boolean>;
    function invoke(param: 'open_log_dir'): Promise<void>;
    function invoke(param: 'status'): Promise<AppStatus>;
    function invoke(param: 'start_mining'): Promise<void>;
    function invoke(param: 'stop_mining'): Promise<void>;
    function invoke(param: 'set_telemetry_mode', payload: { telemetryMode: boolean }): Promise<void>;
    function invoke(param: 'get_telemetry_mode'): Promise<boolean>;
    function invoke(param: 'set_auto_mining', payload: { autoMining: boolean }): Promise<void>;
    function invoke(param: 'set_user_inactivity_timeout', payload: { timeout: number }): Promise<void>;
    function invoke(param: 'update_applications'): Promise<void>;
    function invoke(param: 'set_mode', payload: { mode: modeType }): Promise<void>;
    function invoke(param: 'get_seed_words'): Promise<string[]>;
    function invoke(param: 'get_applications_versions'): Promise<ApplicationsVersions>;
    function invoke(param: 'set_monero_address', payload: { moneroAddress: string }): Promise<void>;
    function invoke(param: 'get_monero_address'): Promise<string>;
    function invoke(
        param: 'log_web_message',
        payload: { level: 'log' | 'error' | 'warn' | 'info'; message: string }
    ): Promise<ApplicationsVersions>;
}
