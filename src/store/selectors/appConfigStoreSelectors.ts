import { BasePoolData, ConfigPools } from '@app/types/configs';

export const getSelectedCpuPool = (state: ConfigPools): BasePoolData | undefined => {
    const selectedCpuPoolName = state.selected_cpu_pool;
    const availableCpuPools = state.available_cpu_pools;

    if (!selectedCpuPoolName || !availableCpuPools) {
        return undefined;
    }

    const selectedCpuPool = availableCpuPools.find((pool) => Object.keys(pool)[0] === selectedCpuPoolName);
    return selectedCpuPool ? Object.values(selectedCpuPool)[0] : undefined;
};

export const getSelectedGpuPool = (state: ConfigPools): BasePoolData | undefined => {
    const selectedGpuPoolName = state.selected_gpu_pool;
    const availableGpuPools = state.available_gpu_pools;

    if (!selectedGpuPoolName || !availableGpuPools) {
        return undefined;
    }

    const selectedGpuPool = availableGpuPools.find((pool) => Object.keys(pool)[0] === selectedGpuPoolName);
    return selectedGpuPool ? Object.values(selectedGpuPool)[0] : undefined;
};

export const getAvailableCpuPools = (state: ConfigPools) => {
    return state.available_cpu_pools ? state.available_cpu_pools.map((pool) => Object.values(pool)[0]) : [];
};

export const getAvailableGpuPools = (state: ConfigPools): BasePoolData[] => {
    return state.available_gpu_pools ? state.available_gpu_pools.map((pool) => Object.values(pool)[0]) : [];
};
