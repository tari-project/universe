import { create } from 'zustand';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';

type State = Partial<AppStatus>;
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (applicationsVersions: ApplicationsVersions) => void;
    setMode: (mode: modeType) => void;
    setCurrentUserInactivityDuration: (duration: number) => void;
}
type AppStatusStoreState = State & Actions;

const initialState: AppStatus = {
    cpu: undefined,
    hardware_status: undefined,
    base_node: undefined,
    wallet_balance: undefined,
    mode: 'Eco',
    auto_mining: false,
    user_inactivity_timeout: undefined,
    current_user_inactivity_duration: undefined,
    applications_versions: undefined,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setCurrentUserInactivityDuration: (current_user_inactivity_duration) =>
                set({ current_user_inactivity_duration }),
            setApplicationsVersions: (applications_versions) => set({ applications_versions }),
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'status-store',
        }
    )
);
