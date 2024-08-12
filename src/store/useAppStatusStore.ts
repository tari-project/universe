import { create } from 'zustand';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (
        applicationsVersions: ApplicationsVersions
    ) => void;
    setMode: (mode: modeType) => void;
    setConfigMode: (mode: modeType) => void;
    setMainAppVersion: (mainAppVersion: string) => void;
}
type AppStatusStoreState = AppStatus & Actions;

const initialState: AppStatus = {
    cpu: undefined,
    base_node: undefined,
    wallet_balance: undefined,
    mode: 'Eco',
    auto_mining: false,
    main_app_version: undefined,
    applications_versions: undefined,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setApplicationsVersions: (applications_versions) =>
                set({ applications_versions }),
            setMainAppVersion: (main_app_version) => set({ main_app_version }),
            setMode: (mode) => set({ mode }),
            setConfigMode: async (mode: modeType) => {
                try {
                    await invoke('set_mode', { mode });
                    set({ mode });
                    console.log(`Mode changed to ${mode}`);
                } catch (e) {
                    console.error('Could not change the mode', e);
                }
            },
        }),
        { name: 'status-store' }
    )
);
