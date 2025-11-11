import { create } from 'zustand';
import { PoolStats } from '../types/app-status.ts';

export type PoolType = 'CPU' | 'GPU';
export interface RewardValues {
    rewardValue?: number | null;
    unpaidFMT?: string;
}
interface MiningPoolsStoreState {
    cpuRewards?: RewardValues;
    cpuPoolStats?: PoolStats;
    gpuRewards?: RewardValues;
    gpuPoolStats?: PoolStats;
}

const initialRewards: RewardValues = {
    rewardValue: null,
    unpaidFMT: '0',
};
const initialState: MiningPoolsStoreState = {
    cpuPoolStats: undefined,
    cpuRewards: initialRewards,
    gpuPoolStats: undefined,
    gpuRewards: initialRewards,
};

export const useMiningPoolsStore = create<MiningPoolsStoreState>()(() => ({
    ...initialState,
}));
