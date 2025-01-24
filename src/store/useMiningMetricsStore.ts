import { BaseNodeStatus, MinerMetrics } from '@app/types/app-status';
import { create } from './create';

interface BlockInfo {
    block_height: number;
    block_time: number;
}
type BaseNodeState = Omit<BaseNodeStatus, 'block_height' | 'block_time'> & { block_time?: number };
type MiningMetricsState = Omit<MinerMetrics, 'base_node'> & { base_node: BaseNodeState } & BlockInfo;

interface Actions {
    setMiningMetrics: (metrics: MinerMetrics) => void;
    setBlockHeight: (block_height: BlockInfo['block_height']) => void;
    setBlockTime: (block_time: BlockInfo['block_time']) => void;
}
type MiningMetricsStoreState = MiningMetricsState & Actions;

const initialState: MiningMetricsState = {
    block_height: 0,
    block_time: 0,
    cpu: {
        hardware: [],
        mining: {
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            connection: { is_connected: false },
        },
    },
    gpu: {
        hardware: [],
        mining: {
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            is_available: true,
        },
    },
    sha_network_hash_rate: 0,
    randomx_network_hash_rate: 0,
    base_node: {
        is_connected: false,
        connected_peers: [],
        block_time: 0,
    },
};

export const useMiningMetricsStore = create<MiningMetricsStoreState>()((set) => ({
    ...initialState,
    setMiningMetrics: (metrics) => set({ ...metrics }),
    setBlockHeight: (block_height) => set({ block_height }),
    setBlockTime: (block_time) => set({ block_time }),
}));
