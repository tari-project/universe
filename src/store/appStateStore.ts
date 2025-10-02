import { create } from 'zustand';
import { ApplicationsVersions, NetworkStatus, SystemDependency } from '@app/types/app-status';
import { CriticalProblemPayload } from '@app/types/events-payloads';

interface AppState {
    error?: string;
    criticalProblem?: Partial<CriticalProblemPayload>;
    isSettingsOpen: boolean;
    criticalError?: Partial<CriticalProblemPayload>;
    systemDependencies: SystemDependency[];
    issueReference?: string;
    applications_versions?: ApplicationsVersions;
    releaseNotes: string;
    isAppUpdateAvailable: boolean;
    networkStatus?: NetworkStatus;
    isStuckOnOrphanChain: boolean;
    isSystrayAppShutdownRequested: boolean;
}

const initialstate: AppState = {
    isSettingsOpen: false,
    systemDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    isStuckOnOrphanChain: false,
    isSystrayAppShutdownRequested: false,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
