import { create } from './create.ts';
import { PoolStats } from '../types/app-status.ts';

interface MiningPoolsStoreState {
    gpuPoolStats?: PoolStats;
    cpuPoolStats?: PoolStats;
}

const initialState: MiningPoolsStoreState = {
    gpuPoolStats: undefined,
    cpuPoolStats: undefined,
};

export const useMiningPoolsStore = create<MiningPoolsStoreState>()(() => ({
    ...initialState,
}));
