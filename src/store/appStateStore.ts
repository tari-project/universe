import { ApplicationsVersions, CriticalProblem, ExternalDependency } from '@app/types/app-status';
import { setAnimationState } from '@app/visuals';
import { create } from './create';
import { invoke } from '@tauri-apps/api/core';
import { useAppConfigStore } from './useAppConfigStore';

import { addToast } from '@app/components/ToastStack/useToastStore';
import { startMining } from '@app/store/miningStoreActions.ts';

interface State {
    error?: string;
    criticalProblem?: Partial<CriticalProblem>;
    setupTitle: string;
    setupTitleParams: Record<string, string>;
    setupProgress: number;
    isSettingsOpen: boolean;
    criticalError?: string;
    setupComplete: boolean;
    externalDependencies: ExternalDependency[];
    missingExternalDependencies?: ExternalDependency[];
    issueReference?: string;
    applications_versions?: ApplicationsVersions;
    releaseNotes: string;
    isAppUpdateAvailable: boolean;
}
interface Actions {
    setCriticalError: (value: string | undefined) => void;
    setError: (value: string | undefined) => void;
    setCriticalProblem: (value?: Partial<CriticalProblem>) => void;
    setIsSettingsOpen: (value: boolean) => void;
    fetchExternalDependencies: () => Promise<void>;
    fetchApplicationsVersions: () => Promise<void>;
    fetchApplicationsVersionsWithRetry: () => Promise<void>;
    updateApplicationsVersions: () => Promise<void>;
    setIssueReference: (value: string) => void;
    fetchReleaseNotes: () => Promise<void>;
    checkForAppUpdate: () => Promise<void>;
}
type AppState = State & Actions;

const initialstate: State = {
    setupTitle: '',
    setupTitleParams: {},
    setupProgress: 0,
    isSettingsOpen: false,
    setupComplete: false,
    externalDependencies: [],
    missingExternalDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
};
export const useAppStateStore = create<AppState>()((set, getState) => ({
    ...initialstate,
    setCriticalError: (criticalError) => set({ criticalError }),
    setError: (error) => {
        set({ error });
        addToast({
            title: 'Error',
            text: error,
            type: 'error',
        });
    },
    setCriticalProblem: (criticalProblem) => set({ criticalProblem }),
    setIsSettingsOpen: (value: boolean) => set({ isSettingsOpen: value }),
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
    fetchExternalDependencies: async () => {
        try {
            const externalDependencies = await invoke('get_external_dependencies');
            set({ externalDependencies });
        } catch (error) {
            console.error('Error loading missing external dependencies', error);
        }
    },
    setIssueReference: (issueReference) => set({ issueReference }),
    fetchReleaseNotes: async () => {
        try {
            const releaseNotes = await invoke('get_release_notes');
            set({ releaseNotes });
        } catch (error) {
            console.error('Error fetching release notes', error);
        }
    },
    checkForAppUpdate: async () => {
        try {
            const version = await invoke('check_for_updates');
            set({ isAppUpdateAvailable: !!version });
        } catch (error) {
            console.error('Error checking for app update', error);
        }
    },
}));

export const setSetupDetails = (setupTitle: string, setupTitleParams: Record<string, string>, setupProgress: number) =>
    useAppStateStore.setState({ setupTitle, setupTitleParams, setupProgress });

export const setSetupComplete = async () => {
    setAnimationState('showVisual');
    // Proceed with auto mining when enabled
    const { mine_on_app_start, cpu_mining_enabled, gpu_mining_enabled } = useAppConfigStore.getState();
    if (mine_on_app_start && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
    useAppStateStore.setState({ setupComplete: true });
};

export const loadExternalDependencies = (externalDependencies: ExternalDependency[]) =>
    useAppStateStore.setState({ externalDependencies });
