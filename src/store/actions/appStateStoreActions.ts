import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '../appStateStore.ts';
import { CriticalProblem, ExternalDependency, NetworkStatus } from '@app/types/app-status.ts';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import { ShowReleaseNotesPayload } from '@app/types/events-payloads.ts';
import { setDialogToShow } from '../index.ts';
import { SetupPhase } from '@app/types/backend-state.ts';
import {
    updateCoreSetupPhaseInfo,
    updateHardwareSetupPhaseInfo,
    updateNodeSetupPhaseInfo,
    updateUnknownSetupPhaseInfo,
    updateWalletSetupPhaseInfo,
} from './setupStoreActions.ts';
import { setShowResumeAppModal } from './uiStoreActions.ts';

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
export const setIsStuckOnOrphanChain = (isStuckOnOrphanChain: boolean) =>
    useAppStateStore.setState({ isStuckOnOrphanChain });
export const loadExternalDependencies = (externalDependencies: ExternalDependency[]) =>
    useAppStateStore.setState({ externalDependencies });
export const setCriticalError = (criticalError: string | undefined) => useAppStateStore.setState({ criticalError });
export const setCriticalProblem = (criticalProblem?: Partial<CriticalProblem>) =>
    useAppStateStore.setState({ criticalProblem });
export const setError = (error: string | undefined, log = false) => {
    useAppStateStore.setState({ error });
    if (log) {
        console.error('setError:', error);
    }
    addToast({ title: 'Error', text: error, type: 'error' });
};
export const setIsAppUpdateAvailable = (isAppUpdateAvailable: boolean) =>
    useAppStateStore.setState({ isAppUpdateAvailable });
export const setIsSettingsOpen = (value: boolean) => useAppStateStore.setState({ isSettingsOpen: value });
export const setIssueReference = (issueReference: string) => useAppStateStore.setState({ issueReference });
export const setReleaseNotes = (releaseNotes: string) => useAppStateStore.setState({ releaseNotes });

export const updateApplicationsVersions = async () => {
    try {
        await invoke('update_applications');
        await fetchApplicationsVersions();
    } catch (error) {
        console.error('Error updating applications versions', error);
    }
};

export const setNetworkStatus = (networkStatus: NetworkStatus) => useAppStateStore.setState({ networkStatus });
export const handleShowRelesaeNotes = (payload: ShowReleaseNotesPayload) => {
    setReleaseNotes(payload.release_notes || '');
    setIsAppUpdateAvailable(payload.is_app_update_available);
    if (payload.should_show_dialog) {
        setDialogToShow('releaseNotes');
    }
};

export const handleRestartingPhases = async (phasesToRestart: SetupPhase[]) => {
    if (phasesToRestart.length === 0) {
        return;
    }

    setShowResumeAppModal(true);

    for (const phase of phasesToRestart) {
        switch (phase) {
            case SetupPhase.Core:
                updateCoreSetupPhaseInfo(undefined);
                break;
            case SetupPhase.Node:
                updateNodeSetupPhaseInfo(undefined);
                break;
            case SetupPhase.Hardware:
                updateHardwareSetupPhaseInfo(undefined);
                break;
            case SetupPhase.Unknown:
                updateUnknownSetupPhaseInfo(undefined);
                break;
            case SetupPhase.Wallet:
                updateWalletSetupPhaseInfo(undefined);
                break;
            default:
                break;
        }
    }
};
