import { create } from './create';
import { BaseNodeStatus, CpuMinerStatus, GpuMinerStatus, GpuDevice } from '@app/types/app-status';

interface MiningMetricsStoreState {
    isNodeConnected: boolean;
    base_node_status: BaseNodeStatus;
    connected_peers: string[];
    gpu_devices: GpuDevice[];
    gpu_mining_status: GpuMinerStatus;
    cpu_mining_status: CpuMinerStatus;
}

const initialState: MiningMetricsStoreState = {
    isNodeConnected: false,
    base_node_status: {
        sha_network_hashrate: 0,
        monero_randomx_network_hashrate: 0,
        tari_randomx_network_hashrate: 0,
        block_reward: 0,
        block_height: 0,
        block_time: 0,
        is_synced: false,
        num_connections: 0,
        readiness_status: '',
    },
    connected_peers: [],
    gpu_devices: [],
    gpu_mining_status: {
        is_mining: false,
        hash_rate: 0,
        estimated_earnings: 0,
        is_available: true,
    },
    cpu_mining_status: {
        is_mining: false,
        hash_rate: 0,
        estimated_earnings: 0,
        connection: { is_connected: false },
    },
};

export const useMiningMetricsStore = create<MiningMetricsStoreState>()(() => ({
    ...initialState,
}));
