import { create } from 'zustand';
import { AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setMode: (mode: modeType) => void;
    setConfigMode: (mode: modeType) => void;
}
type AppStatusStoreState = AppStatus & Actions;

const initialState: AppStatus = {
    cpu: undefined,
    base_node: undefined,
    wallet_balance: undefined,
    mode: 'Eco',
    auto_mining: false,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
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
