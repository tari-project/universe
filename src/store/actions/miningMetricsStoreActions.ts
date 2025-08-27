import { CpuMinerStatus, GpuDevice, GpuMinerStatus } from '@app/types/app-status.ts';

import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

export const setGpuDevices = (gpu_devices: GpuDevice[]) => {
    useMiningMetricsStore.setState({ gpu_devices });
};
export const setGpuMiningStatus = (gpu_mining_status: GpuMinerStatus) => {
    useMiningMetricsStore.setState((c) => ({ ...c, gpu_mining_status }));
};
export const setCpuMiningStatus = (cpu_mining_status: CpuMinerStatus) => {
    useMiningMetricsStore.setState((c) => ({ ...c, cpu_mining_status }));
};
