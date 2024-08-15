import { create } from 'zustand';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';

type State = Partial<AppStatus>;
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (applicationsVersions: ApplicationsVersions) => void;
    setMode: (mode: modeType) => void;
    setConfigMode: (mode: modeType) => void;
    setMainAppVersion: (mainAppVersion: string) => void;
}
type AppStatusStoreState = State & Actions;

const initialState: State = {
    wallet_balance: undefined,
    mode: 'Eco',
    auto_mining: false,
    main_app_version: undefined,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setApplicationsVersions: (applications_versions) => set({ applications_versions }),
            setMainAppVersion: (main_app_version) => set({ main_app_version }),
            setMode: (mode) => set({ mode }),
            setConfigMode: async (mode: modeType) => {
                try {
                    await invoke('set_mode', { mode });
                    set({ mode });
                    console.info(`Mode changed to ${mode}`);
                } catch (e) {
                    console.error('Could not change the mode', e);
                }
            },
        }),
        {
            name: 'status-store',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
