import { create } from './create';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';

type State = Partial<AppStatus>;

interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (applicationsVersions: ApplicationsVersions) => void;
    setMode: (mode: modeType) => void;
    setP2poolEnabled: (p2poolEnabled: boolean) => void;
}

type AppStatusStoreState = State & Actions;

const initialState: State = {
    cpu: undefined,
    hardware_status: undefined,
    base_node: undefined,
    p2pool_enabled: false,
    p2pool_stats: undefined,
    wallet_balance: undefined,
    mode: 'Eco',
    applications_versions: undefined,
    monero_address: undefined,
    cpu_mining_enabled: false,
    gpu_mining_enabled: false,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setApplicationsVersions: (applications_versions) => set({ applications_versions }),
            setMode: (mode) => set({ mode }),
            setP2poolEnabled: (p2pool_enabled) => set({ p2pool_enabled }),
        }),
        {
            name: 'statusStore',
            version: 0.1,
            partialize: (s) => ({
                mode: s.mode,
                cpu_mining_enabled: s.cpu_mining_enabled,
                gpu_mining_enabled: s.gpu_mining_enabled,
                p2pool_enabled: s.p2pool_enabled,
                monero_address: s.monero_address,
            }),
        }
    )
);
