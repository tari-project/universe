import { AppStatus } from './app-status';

declare module '@tauri-apps/api/tauri' {
    function invoke(param: 'setup_application'): Promise<void>;
    function invoke(
        param: 'check_user_mouse_position'
    ): Promise<[number, number]>;
    function invoke(param: 'status'): Promise<AppStatus>;
    function invoke(param: 'start_mining'): Promise<void>;
    function invoke(param: 'stop_mining'): Promise<void>;
    function invoke(param: 'start_listening_to_user_activity'): Promise<void>;
    function invoke(param: 'stop_listening_to_user_activity'): Promise<void>;
}
