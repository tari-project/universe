import { PoolStats } from '@app/types/app-status';
import { useMiningPoolsStore } from '../useMiningPoolsStore';

export const loadCpuPoolStats = (cpuPoolStats: PoolStats) => {
    useMiningPoolsStore.setState({
        cpuPoolStats,
    });
};

export const loadGpuPoolStats = (gpuPoolStats: PoolStats) => {
    useMiningPoolsStore.setState({
        gpuPoolStats,
    });
};
