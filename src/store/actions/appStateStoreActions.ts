import { invoke } from '@tauri-apps/api/core';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import { startMining } from './miningStoreActions.ts';
import { useAppConfigStore } from '../useAppConfigStore.ts';
import { useAppStateStore } from '../appStateStore.ts';
import { setAnimationState } from '@tari-project/tari-tower';
import { CriticalProblem, ExternalDependency, NetworkStatus } from '@app/types/app-status.ts';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import { ResumingAllProcessesPayload } from '@app/hooks/app/useListenForAppResuming.ts';

export const fetchApplicationsVersions = async () => {
    try {
        console.info('Fetching applications versions');
        const applications_versions = await invoke('get_applications_versions');
        useAppStateStore.setState({ applications_versions });
    } catch (error) {
        console.error('Error getting applications versions', error);
    }
};
export const fetchApplicationsVersionsWithRetry = async () => {
    let retries = 5;
    while (retries) {
        const applications_versions = useAppStateStore.getState().applications_versions;
        if (applications_versions && Object.values(applications_versions).every((version) => Boolean(version))) {
            break;
        }

        try {
            await fetchApplicationsVersions();
            retries--;
        } catch (error) {
            console.error('Error getting applications versions', error);
        }
    }
};
export const fetchExternalDependencies = async () => {
    try {
        const externalDependencies = await invoke('get_external_dependencies');
        useAppStateStore.setState({ externalDependencies });
    } catch (error) {
        console.error('Error loading missing external dependencies', error);
    }
};
export const loadExternalDependencies = (externalDependencies: ExternalDependency[]) =>
    useAppStateStore.setState({ externalDependencies });
export const setAppResumePayload = (appResumePayload: ResumingAllProcessesPayload) =>
    useAppStateStore.setState({ appResumePayload });
export const setCriticalError = (criticalError: string | undefined) => useAppStateStore.setState({ criticalError });
export const setCriticalProblem = (criticalProblem?: Partial<CriticalProblem>) =>
    useAppStateStore.setState({ criticalProblem });
export const setError = (error: string | undefined) => {
    useAppStateStore.setState({ error });
    console.error('setError:', error);
    addToast({ title: 'Error', text: error, type: 'error' });
};
export const setIsAppUpdateAvailable = (isAppUpdateAvailable: boolean) =>
    useAppStateStore.setState({ isAppUpdateAvailable });
export const setIsSettingsOpen = (value: boolean) => useAppStateStore.setState({ isSettingsOpen: value });
export const setIssueReference = (issueReference: string) => useAppStateStore.setState({ issueReference });
export const setReleaseNotes = (releaseNotes: string) => useAppStateStore.setState({ releaseNotes });
export const setSetupComplete = async () => {
    // Proceed with auto mining when enabled
    const mine_on_app_start = useAppConfigStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
    const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
    const visual_mode = useAppConfigStore.getState().visual_mode;
    if (visual_mode) {
        try {
            setAnimationState('showVisual');
        } catch (error) {
            console.error('Failed to set animation state:', error);
        }
    }
    if (mine_on_app_start && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
    useAppStateStore.setState({ setupComplete: true });
};
export const setSetupParams = (setupTitleParams: Record<string, string>) =>
    useAppStateStore.setState((current) => {
        const isEqual = deepEqual(current.setupTitleParams, setupTitleParams);
        return { setupTitleParams: isEqual ? current.setupTitleParams : setupTitleParams };
    });
export const setSetupProgress = (setupProgress: number) => useAppStateStore.setState({ setupProgress });
export const setSetupTitle = (setupTitle: string) => useAppStateStore.setState({ setupTitle });
export const updateApplicationsVersions = async () => {
    try {
        await invoke('update_applications');
        await fetchApplicationsVersions();
    } catch (error) {
        console.error('Error updating applications versions', error);
    }
};

export const setNetworkStatus = (networkStatus: NetworkStatus) => useAppStateStore.setState({ networkStatus });
