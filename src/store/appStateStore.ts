import { ApplicationsVersions } from '@app/types/app-status';
import { create } from './create';
import { invoke } from '@tauri-apps/api';

interface AppState {
    isAfterAutoUpdate: boolean;
    setIsAfterAutoUpdate: (value: boolean) => void;
    criticalError?: string;
    setCriticalError: (value: string | undefined) => void;
    error?: string;
    setError: (value: string | undefined) => void;
    topStatus: string;
    setTopStatus: (value: string) => void;
    setupTitle: string;
    setupTitleParams: Record<string, string>;
    setupProgress: number;
    setSetupDetails: (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (value: boolean) => void;
    isSettingUp: boolean;
    settingUpFinished: () => void;
    applications_versions?: ApplicationsVersions;
    fetchApplicationsVersions: () => Promise<void>;
    updateApplicationsVersions: () => Promise<void>;
}

export const useAppStateStore = create<AppState>()((set, getState) => ({
    isAfterAutoUpdate: false,
    setIsAfterAutoUpdate: (value: boolean) => set({ isAfterAutoUpdate: value }),
    criticalError: undefined,
    setCriticalError: (criticalError) => set({ criticalError }),
    error: undefined,
    setError: (error) => set({ error }),
    topStatus: 'Not mining',
    setTopStatus: (value) => set({ topStatus: value }),
    setupTitle: '',
    setupTitleParams: {},
    setupProgress: 0,
    setSetupDetails: (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) =>
        set({ setupTitle, setupTitleParams, setupProgress }),
    isSettingsOpen: false,
    setIsSettingsOpen: (value: boolean) => set({ isSettingsOpen: value }),
    isSettingUp: true,
    settingUpFinished: () => set({ isSettingUp: false }),
    applications_versions: undefined,
    fetchApplicationsVersions: async () => {
        let applications_versions = getState().applications_versions;
        let retries = 5;
        while (
            (!applications_versions ||
                !Object.values(applications_versions).every((version) => version !== undefined)) &&
            retries
        ) {
            try {
                console.info('Fetching applications versions');
                applications_versions = await invoke('get_applications_versions');
                set({ applications_versions });
                retries--;
            } catch (error) {
                console.error('Error getting applications versions', error);
            }
        }
    },
    updateApplicationsVersions: async () => {
        try {
            await invoke('update_applications');
            await getState().fetchApplicationsVersions();
        } catch (error) {
            console.error('Error updating applications versions', error);
        }
    },
}));
