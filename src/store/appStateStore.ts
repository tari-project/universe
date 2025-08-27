import { ApplicationsVersions, NetworkStatus, SystemDependency } from '@app/types/app-status';
import { create } from './create';
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
}

const initialstate: AppState = {
    isSettingsOpen: false,
    systemDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    isStuckOnOrphanChain: false,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
