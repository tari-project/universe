import { AppStatus } from './app-status';

declare module '@tauri-apps/api/tauri' {
    function invoke(param: 'setup_application'): Promise<void>;
    function invoke(param: 'open_log_dir'): Promise<void>;
    function invoke(param: 'status'): Promise<AppStatus>;
    function invoke(param: 'start_mining'): Promise<void>;
    function invoke(param: 'stop_mining'): Promise<void>;
    function invoke(
        param: 'set_auto_mining',
        payload: { autoMining: boolean }
    ): Promise<void>;
}
