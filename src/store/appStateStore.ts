import { ApplicationsVersions } from '@app/types/app-status';
import { create } from './create';
import { invoke } from '@tauri-apps/api';
import { useAppConfigStore } from './useAppConfigStore';
import { useMiningStore } from './useMiningStore';

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
    settingUpFinished: () => Promise<void>;
    applications_versions?: ApplicationsVersions;
    fetchApplicationsVersions: () => Promise<void>;
    fetchApplicationsVersionsWithRetry: () => Promise<void>;
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
    settingUpFinished: async () => {
        set({ isSettingUp: false });

        // Proceed with auto mining when enabled
        const { auto_mining, cpu_mining_enabled, gpu_mining_enabled } = useAppConfigStore.getState();
        if (auto_mining && (cpu_mining_enabled || gpu_mining_enabled)) {
            const { startMining } = useMiningStore.getState();
            await startMining();
        }
    },
    applications_versions: undefined,
    fetchApplicationsVersions: async () => {
        try {
            console.info('Fetching applications versions');
            const applications_versions = await invoke('get_applications_versions');
            set({ applications_versions });
        } catch (error) {
            console.error('Error getting applications versions', error);
        }
    },
    fetchApplicationsVersionsWithRetry: async () => {
        let retries = 5;
        while (retries) {
            const applications_versions = getState().applications_versions;
            if (applications_versions && Object.values(applications_versions).every((version) => Boolean(version))) {
                break;
            }

            try {
                console.info('Fetching applications versions');
                await getState().fetchApplicationsVersions();
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
