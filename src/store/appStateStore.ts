import { create } from 'zustand';
import { ApplicationsVersions, NetworkStatus, SystemDependency, SystemDependencyStatus } from '@app/types/app-status';
import { CriticalProblemPayload } from '@app/types/events-payloads';
import { AppModule } from '@app/store/types/setup.ts';

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
    systemDependencies: [
        {
            id: 'fake',
            required_by_app_modules: [AppModule.GpuMining],
            ui_info: {
                display_name: 'Missing',
                display_description: 'Missing app module',
                manufacturer: {
                    name: 'Missing',
                    url: '',
                    logo_url: '',
                },
            },
            download_url: '',
            status: SystemDependencyStatus.NotInstalled,
        },
    ],
    releaseNotes: '',
    isAppUpdateAvailable: false,
    isStuckOnOrphanChain: false,
};

export const useAppStateStore = create<AppState>()(() => ({
    ...initialstate,
}));
