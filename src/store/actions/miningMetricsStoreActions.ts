import { CpuMinerStatus, GpuDevice, GpuMinerStatus } from '@app/types/app-status.ts';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

export const setGpuDevices = (gpu_devices: GpuDevice[]) => {
    useMiningMetricsStore.setState((c) => (deepEqual(c.gpu_devices, gpu_devices) ? c : { ...c, gpu_devices }));
};
export const setGpuMiningStatus = (gpu_mining_status: GpuMinerStatus) => {
    useMiningMetricsStore.setState((c) =>
        deepEqual(c.gpu_mining_status, gpu_mining_status) ? c : { ...c, gpu_mining_status }
    );
};
export const setCpuMiningStatus = (cpu_mining_status: CpuMinerStatus) => {
    useMiningMetricsStore.setState((c) =>
        deepEqual(c.cpu_mining_status, cpu_mining_status) ? c : { ...c, cpu_mining_status }
    );
};
