import { BaseNodeStatus, CpuMinerStatus, GpuMinerStatus, PublicDeviceParameters } from '@app/types/app-status';
import { create } from './create';

interface Actions {
    setBaseNodeStatus: (baseNodeStatus: BaseNodeStatus) => void;
    setGpuDevices: (gpuDevices: PublicDeviceParameters[]) => void;
    setCpuMiningStatus: (cpuMiningStatus: CpuMinerStatus) => void;
    setGpuMiningStatus: (gpuMiningStatus: GpuMinerStatus) => void;
    setConnectedPeers: (connectedPeers: string[]) => void;
}

interface MiningMetricsStoreState {
    base_node_status: BaseNodeStatus;
    connected_peers: string[];
    cpu_devices: PublicDeviceParameters[];
    gpu_devices: PublicDeviceParameters[];
    gpu_mining_status: GpuMinerStatus;
    cpu_mining_status: CpuMinerStatus;
}

type MiningMetricsStore = MiningMetricsStoreState & Actions;

const initialState: MiningMetricsStoreState = {
    base_node_status: {
        block_height: 0,
        block_time: 0,
        is_connected: false,
        sha_network_hash_rate: 0,
        randomx_network_hash_rate: 0,
    },
    connected_peers: [],
    cpu_devices: [],
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

export const useMiningMetricsStore = create<MiningMetricsStore>()((set) => ({
    ...initialState,
    setGpuDevices: (gpu_devices) => {
        set({ gpu_devices });
    },
    setGpuMiningStatus: (gpu_mining_status) => {
        set({ gpu_mining_status });
    },
    setCpuMiningStatus: (cpu_mining_status) => {
        set({ cpu_mining_status });
    },
    setConnectedPeers: (connected_peers) => {
        set({ connected_peers });
    },
    setBaseNodeStatus: (base_node_status) => {
        console.log('setBaseNodeStatus', base_node_status);
        set({ base_node_status });
    },
}));
