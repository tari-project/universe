import { create } from './create.ts';
import { PoolStats } from '../types/app-status.ts';

export interface RewardValues {
    rewardValue?: number;
    unpaidFMT?: string;
}
interface MiningPoolsStoreState {
    cpuRewards?: RewardValues;
    cpuPoolStats?: PoolStats;
    gpuRewards?: RewardValues;
    gpuPoolStats?: PoolStats;
}

const initialRewards: RewardValues = {
    rewardValue: 0,
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
