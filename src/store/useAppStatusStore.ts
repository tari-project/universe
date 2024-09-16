import { create } from './create';
import { ApplicationsVersions, AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';

type State = Partial<AppStatus>;

interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setApplicationsVersions: (applicationsVersions: ApplicationsVersions) => void;
    setMode: (mode: modeType) => void;
    setP2poolEnabled: (p2poolEnabled: boolean) => void;
    setTelemetryMode: (telemetryMode: boolean) => void;
    setMoneroAddress: (moneroAddress: string) => void;
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
    tari_address_base58: undefined,
    tari_address_emoji: undefined,
    cpu_mining_enabled: false,
    gpu_mining_enabled: false,
};
export const useAppStatusStore = create<AppStatusStoreState>()((set) => ({
    ...initialState,
    setTelemetryMode: (telemetry_mode) => set({ telemetry_mode }),
    setAppStatus: (appStatus) => set({ ...appStatus }),
    setApplicationsVersions: (applications_versions) => set({ applications_versions }),
    setMoneroAddress: (monero_address) => set({ monero_address }),
    setMode: (mode) => set({ mode }),
    setP2poolEnabled: (p2pool_enabled) => set({ p2pool_enabled }),
}));
