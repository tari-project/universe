import { BaseNodeStatus, CpuMinerStatus, GpuMinerStatus, PublicDeviceParameters } from '@app/types/app-status';
import { create } from './create';
import { useBlockchainVisualisationStore } from './useBlockchainVisualisationStore';
import { setAnimationState } from '@tari-project/tari-tower';
import { useMiningStore } from './useMiningStore';

interface Actions {
    handleBaseNodeStatusUpdate: (baseNodeStatus: BaseNodeStatus) => void;
    setGpuDevices: (gpuDevices: PublicDeviceParameters[]) => void;
    setCpuMiningStatus: (cpuMiningStatus: CpuMinerStatus) => void;
    setGpuMiningStatus: (gpuMiningStatus: GpuMinerStatus) => void;
    handleConnectedPeersUpdate: (connectedPeers: string[]) => void;
    handleMiningModeChange: () => void;
}

interface MiningMetricsStoreState {
    isNodeConnected: boolean;
    base_node_status: BaseNodeStatus;
    connected_peers: string[];
    cpu_devices: PublicDeviceParameters[];
    gpu_devices: PublicDeviceParameters[];
    gpu_mining_status: GpuMinerStatus;
    cpu_mining_status: CpuMinerStatus;
}

type MiningMetricsStore = MiningMetricsStoreState & Actions;

const initialState: MiningMetricsStoreState = {
    isNodeConnected: false,
    base_node_status: {
        block_height: 0,
        block_time: 0,
        is_synced: false,
        sha_network_hashrate: 0,
        randomx_network_hashrate: 0,
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

export const useMiningMetricsStore = create<MiningMetricsStore>()((set, getState) => ({
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
    handleConnectedPeersUpdate: (connected_peers) => {
        const wasNodeConnected = getState().isNodeConnected;
        const isNodeConnected = connected_peers?.length > 0;
        set({ connected_peers, isNodeConnected });

        const { miningInitiated } = useMiningStore.getState();
        if (miningInitiated) {
            if (!isNodeConnected && wasNodeConnected) {
                // Lost connection
                setAnimationState('stop');
            }
            if (isNodeConnected && !wasNodeConnected) {
                // Restored connection
                setAnimationState('start');
            }
        }
    },
    handleBaseNodeStatusUpdate: (base_node_status) => {
        set({ base_node_status });

        const { displayBlockHeight, setDisplayBlockHeight } = useBlockchainVisualisationStore.getState();
        if (base_node_status.block_height && !displayBlockHeight) {
            // initial set, later updates via new block height handlers only
            setDisplayBlockHeight(base_node_status.block_height);
        }
    },
    handleMiningModeChange: () => {
        set({
            cpu_mining_status: {
                ...getState().cpu_mining_status,
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
            },
            gpu_mining_status: {
                ...getState().gpu_mining_status,
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
            },
        });
    },
}));
