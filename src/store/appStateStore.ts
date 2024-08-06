import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

interface AppState {
    error: string;
    setError: (value: string) => void;
    topStatus: string;
    setTopStatus: (value: string) => void;
    errorOpen: boolean;
    setErrorOpen: (value: boolean) => void;
    setupTitle: string;
    setupProgress: number;
    setSetupDetails: (setupTitle: string, setupProgress: number) => void;

    // gui

    isSettingUp: boolean;

    // functions
    startMining: () => Promise<void>;
    stopMining: () => Promise<void>;
    settingUpFinished: () => Promise<void>;
}

const useAppStateStore = create<AppState>((set) => ({
    error: '',
    setError: (value) => set({ error: value }),
    topStatus: 'Not mining',
    setTopStatus: (value) => set({ topStatus: value }),
    errorOpen: false,
    setErrorOpen: (value) => set({ errorOpen: value }),

    isSettingUp: true,
    setupTitle: '',
    setupProgress: 0,
    setSetupDetails: (setupTitle: string, setupProgress: number) =>
        set({ setupTitle, setupProgress }),

    // functions
    settingUpFinished: async () => {
        set({
            isSettingUp: false,
        });
    },

    startMining: async () => {
        try {
            await invoke('start_mining', {});
            console.log('Mining started');
        } catch (e) {
            console.error('Could not start mining', e);
        }
    },
    stopMining: async () => {
        try {
            await invoke('stop_mining', {});
            console.log('Mining stopped');
        } catch (e) {
            console.error('Could not stop mining', e);
        }
    },
}));

export default useAppStateStore;
