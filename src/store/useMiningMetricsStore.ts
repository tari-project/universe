import { create } from 'zustand';
import { CpuMinerStatus, GpuMinerStatus, GpuDevice } from '@app/types/app-status';

interface MiningMetricsStoreState {
    gpu_devices: GpuDevice[];
    gpu_mining_status: GpuMinerStatus;
    cpu_mining_status: CpuMinerStatus;
}

const initialState: MiningMetricsStoreState = {
    gpu_devices: [],
    gpu_mining_status: {
        is_mining: false,
        hash_rate: 0,
        estimated_earnings: 0,
        is_available: true,
    },
    cpu_mining_status: {
        is_mining: false,
        hash_rate: 0,
        estimated_earnings: 0,
        connection: { is_connected: false },
    },
};

export const useMiningMetricsStore = create<MiningMetricsStoreState>()(() => ({
    ...initialState,
}));
