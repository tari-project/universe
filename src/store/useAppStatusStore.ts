import { create } from 'zustand';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';

type State = Partial<AppStatus>;

interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (applicationsVersions: ApplicationsVersions) => void;
    setMode: (mode: modeType) => void;
    setConfigMode: (mode: modeType) => void;
    setP2poolEnabled: (p2poolEnabled: boolean) => void;
    setTelemetryMode: (telemetryMode: boolean) => void;
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
            setTelemetryMode: (telemetry_mode) => set({ telemetry_mode }),
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setApplicationsVersions: (applications_versions) => set({ applications_versions }),
            setMode: (mode) => set({ mode }),
            setP2poolEnabled: (p2pool_enabled) => set({ p2pool_enabled }),
            setConfigMode: async (mode) => {
                try {
                    await invoke('set_mode', { mode });
                    set({ mode });
                    console.info(`Mode changed to ${mode}`);
                } catch (e) {
                    console.error('Could not change the mode', e);
                }
            },
        }),
        {
            name: 'status-store',
        }
    )
);
