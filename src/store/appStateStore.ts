import {
    ApplicationsVersions,
    ExternalDependency,
    ExternalDependencyStatus,
    NetworkStatus,
} from '@app/types/app-status';
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
const fake: ExternalDependency = {
    required_version_names: ['1', '2'],
    display_name: 'Microsoft Visual C++ 2022 x64 Additional Runtime',
    display_description: 'This is the additional runtime required to run Tari applications.',
    download_url: 'bla',
    version: '22',
    manufacturer: {
        name: 'Microsoft',
        url: 'https://www.microsoft.com',
        logo: 'https://www.microsoft.com/favicon.ico',
    },
    status: ExternalDependencyStatus.NotInstalled,
};
const initialstate: AppState = {
    isSettingsOpen: false,
    externalDependencies: [fake],
    missingExternalDependencies: [],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    isStuckOnOrphanChain: false,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
