import { MinerMetrics } from '@app/types/app-status';
import { create } from './create';

interface Actions {
    setMiningMetrics: (metrics: MinerMetrics) => void;
}

type MiningMetricsStoreState = MinerMetrics & Actions;

const initialState: MinerMetrics = {
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
        block_height: 0,
        block_time: 0,
        is_synced: false,
        is_connected: false,
        connected_peers: [],
    },
};

export const useMiningMetricsStore = create<MiningMetricsStoreState>()((set) => ({
    ...initialState,
    setMiningMetrics: (metrics) => set({ ...metrics }),
}));
