import { ApplicationsVersions, CriticalProblem, ExternalDependency } from '@app/types/app-status';
import { setAnimationState } from '@app/visuals';
import { create } from './create';
import { invoke } from '@tauri-apps/api/core';
import { useAppConfigStore } from './useAppConfigStore';
import { useMiningStore } from './useMiningStore';
import { addToast } from '@app/components/ToastStack/useToastStore';

interface AppState {
    isAfterAutoUpdate: boolean;
    setIsAfterAutoUpdate: (value: boolean) => void;
    criticalError?: string;
    setCriticalError: (value: string | undefined) => void;
    error?: string;
    setError: (value: string | undefined) => void;
    criticalProblem?: Partial<CriticalProblem>;
    setCriticalProblem: (value?: Partial<CriticalProblem>) => void;
    topStatus: string;
    setTopStatus: (value: string) => void;
    setupTitle: string;
    setupTitleParams: Record<string, string>;
    setupProgress: number;
    setSetupDetails: (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (value: boolean) => void;
    isSettingUp: boolean;
    setIsSettingUp: (value: boolean) => void;
    setSettingUpFinished: () => Promise<void>;
    externalDependencies: ExternalDependency[];
    fetchExternalDependencies: () => Promise<void>;
    loadExternalDependencies: (missingExternalDependencies: ExternalDependency[]) => void;
    applications_versions?: ApplicationsVersions;
    fetchApplicationsVersions: () => Promise<void>;
    fetchApplicationsVersionsWithRetry: () => Promise<void>;
    updateApplicationsVersions: () => Promise<void>;
    issueReference?: string;
    setIssueReference: (value: string) => void;
    triggerNotification: (summary: string, body: string) => Promise<void>;
}

export const useAppStateStore = create<AppState>()((set, getState) => ({
    isAfterAutoUpdate: false,
    setIsAfterAutoUpdate: (value: boolean) => set({ isAfterAutoUpdate: value }),
    criticalError: undefined,
    setCriticalError: (criticalError) => set({ criticalError }),
    error: undefined,
    setError: (error) => {
        set({ error });
        addToast({
            title: 'Error',
            text: error,
            type: 'error',
        });
    },
    setCriticalProblem: (criticalProblem) => set({ criticalProblem }),
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
    setIsSettingUp: (value: boolean) => set({ isSettingUp: value }),
    setSettingUpFinished: async () => {
        set({ isSettingUp: false });
        setAnimationState('showVisual');

        // Proceed with auto mining when enabled
        const { mine_on_app_start, cpu_mining_enabled, gpu_mining_enabled } = useAppConfigStore.getState();
        if (mine_on_app_start && (cpu_mining_enabled || gpu_mining_enabled)) {
            const startMining = useMiningStore.getState().startMining;
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
    externalDependencies: [],
    fetchExternalDependencies: async () => {
        try {
            const externalDependencies = await invoke('get_external_dependencies');
            set({ externalDependencies });
        } catch (error) {
            console.error('Error loading missing external dependencies', error);
        }
    },
    missingExternalDependencies: [],
    loadExternalDependencies: (externalDependencies: ExternalDependency[]) => set({ externalDependencies }),
    setIssueReference: (issueReference) => set({ issueReference }),
    triggerNotification: async (summary: string, body: string) => {
        try {
            await invoke('trigger_notification', {
                summary,
                body,
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Error triggering notification', error);
        }
    },
}));
