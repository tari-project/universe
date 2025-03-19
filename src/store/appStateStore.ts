import { ResumingAllProcessesPayload } from '@app/hooks/app/useListenForAppResuming.ts';
import { ApplicationsVersions, CriticalProblem, ExternalDependency, NetworkStatus } from '@app/types/app-status';
import { create } from './create';

interface AppState {
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
    networkStatus?: NetworkStatus;
    appResumePayload?: ResumingAllProcessesPayload;
}

const initialstate: AppState = {
    setupTitle: '',
    setupTitleParams: {},
    setupProgress: 0,
    isSettingsOpen: false,
    setupComplete: false,
    externalDependencies: [],
    missingExternalDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    appResumePayload: undefined,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
