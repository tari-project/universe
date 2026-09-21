import { create } from 'zustand';
import { ApplicationsVersions, NetworkStatus, SystemDependency } from '@app/types/app-status';
import { CriticalProblemPayload, WalletRecoveryPayload } from '@app/types/events-payloads';

interface AppState {
    error?: string;
    criticalProblem?: Partial<CriticalProblemPayload>;
    isSettingsOpen: boolean;
    criticalError?: Partial<CriticalProblemPayload>;
    /**
     * Set when the backend cannot vouch for the wallet: initialization failed, or the startup
     * keyring probe could not read the seed. Distinct from `criticalProblem` because the app
     * itself is fine - settings and log export stay usable - only the wallet needs attention.
     */
    walletRecovery?: WalletRecoveryPayload;
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
