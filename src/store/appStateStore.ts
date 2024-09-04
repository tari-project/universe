import { create } from 'zustand';

interface AppState {
    error?: string;
    setError: (value: string | undefined) => void;
    topStatus: string;
    setTopStatus: (value: string) => void;
    errorOpen: boolean;
    setErrorOpen: (value: boolean) => void;
    setupTitle: string;
    setupTitleParams: Record<string, string>;
    setupProgress: number;
    setSetupDetails: (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) => void;

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
    setupTitleParams: {},
    setupProgress: 0,
    setSetupDetails: (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) =>
        set({ setupTitle, setupTitleParams, setupProgress }),

    // functions
    settingUpFinished: () => set({ isSettingUp: false }),
}));

export default useAppStateStore;
