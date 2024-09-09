import { create } from './create';
import { persist } from 'zustand/middleware';

interface AppState {
    isAfterAutoUpdate: boolean;
    setIsAfterAutoUpdate: (value: boolean) => void;
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

export const useAppStateStore = create<AppState>()(
    persist(
        (set) => ({
            isAfterAutoUpdate: false,
            setIsAfterAutoUpdate: (value: boolean) => set({ isAfterAutoUpdate: value }),
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
                set({ setupTitle, setupTitleParams, setupProgress, isSettingUp: setupProgress < 1 }),

            // functions
            settingUpFinished: () => set({ isSettingUp: false }),
        }),
        {
            name: 'appStateStore',
            version: 0.1,
            partialize: (s) => ({
                isSettingUp: s.isSettingUp,
                isAfterAutoUpdate: s.isAfterAutoUpdate,
                setupProgress: s.setupProgress,
                error: s.error,
            }),
        }
    )
);
