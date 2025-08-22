import { BasePoolData, ConfigPools } from '@app/types/configs';

export const getSelectedCpuPool = (state: ConfigPools): BasePoolData | undefined => {
    const selectedCpuPoolName = state.selected_cpu_pool;
    const availableCpuPools = state.available_cpu_pools;

    if (!selectedCpuPoolName || !availableCpuPools) {
        return undefined;
    }

    const selectedCpuPool = availableCpuPools[selectedCpuPoolName];
    return selectedCpuPool ? selectedCpuPool : undefined;
};

export const getSelectedGpuPool = (state: ConfigPools): BasePoolData | undefined => {
    const selectedGpuPoolName = state.selected_gpu_pool;
    const availableGpuPools = state.available_gpu_pools;

    if (!selectedGpuPoolName || !availableGpuPools) {
        return undefined;
    }

    const selectedGpuPool = availableGpuPools[selectedGpuPoolName];
    return selectedGpuPool ? selectedGpuPool : undefined;
};

export const getAvailableCpuPools = (state: ConfigPools) => {
    return state.available_cpu_pools ? Object.values(state.available_cpu_pools) : [];
};

export const getAvailableGpuPools = (state: ConfigPools): BasePoolData[] => {
    return state.available_gpu_pools ? Object.values(state.available_gpu_pools) : [];
};
