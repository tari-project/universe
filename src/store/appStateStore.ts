import { create } from 'zustand';

interface AppState {
    error?: string;
    setError: (value: string | undefined) => void;
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
    settingUpFinished: () => void;
}

const useAppStateStore = create<AppState>()((set) => ({
    error: undefined,
    setError: (error) => set({ error }),
    topStatus: 'Not mining',
    setTopStatus: (value) => set({ topStatus: value }),
    errorOpen: false,
    setErrorOpen: (value) => set({ errorOpen: value }),
    isSettingUp: true,
    setupTitle: '',
    setupProgress: 0,
    setSetupDetails: (setupTitle: string, setupProgress: number) => set({ setupTitle, setupProgress }),

    // functions
    settingUpFinished: () => set({ isSettingUp: false }),
}));

export default useAppStateStore;
