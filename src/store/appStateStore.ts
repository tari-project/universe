import { ApplicationsVersions, ExternalDependency, NetworkStatus } from '@app/types/app-status';
import { create } from './create';
import { CriticalProblemPayload } from '@app/types/events-payloads';

interface AppState {
    error?: string;
    criticalProblem?: Partial<CriticalProblemPayload>;
    isSettingsOpen: boolean;
    criticalError?: Partial<CriticalProblemPayload>;
    externalDependencies: ExternalDependency[];
    missingExternalDependencies?: ExternalDependency[];
    issueReference?: string;
    applications_versions?: ApplicationsVersions;
    releaseNotes: string;
    isAppUpdateAvailable: boolean;
    networkStatus?: NetworkStatus;
    isStuckOnOrphanChain: boolean;
}

const initialstate: AppState = {
    isSettingsOpen: false,
    externalDependencies: [],
    missingExternalDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    isStuckOnOrphanChain: false,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
