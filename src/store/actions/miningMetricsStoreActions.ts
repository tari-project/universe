import { BaseNodeStatus, CpuMinerStatus, GpuDevice, GpuMinerStatus } from '@app/types/app-status.ts';
import { setGpuMiningEnabled } from './appConfigStoreActions';
import {
    useBlockchainVisualisationStore,
    useConfigMiningStore,
    useMiningMetricsStore,
    useMiningStore,
    useWalletStore,
} from '../';
import { setAnimationState } from '@tari-project/tari-tower';
import { useSetupStore } from '@app/store/useSetupStore.ts';

export const setGpuDevices = (gpu_devices: GpuDevice[]) => {
    useMiningMetricsStore.setState({ gpu_devices });
    const gpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;

    if (!gpuMiningEnabled && gpu_devices.some((gpu) => gpu.settings.is_available && !gpu.settings.is_excluded)) {
        setGpuMiningEnabled(true);
    }

    if (gpuMiningEnabled && gpu_devices.every((gpu) => gpu.settings.is_excluded)) {
        setGpuMiningEnabled(false);
    }
};
export const setGpuMiningStatus = (gpu_mining_status: GpuMinerStatus) => {
    useMiningMetricsStore.setState({ gpu_mining_status });
};
export const setCpuMiningStatus = (cpu_mining_status: CpuMinerStatus) => {
    useMiningMetricsStore.setState((current) => {
        const updatedPoolStatus = cpu_mining_status.pool_status ?? current.cpu_mining_status.pool_status;
        return {
            cpu_mining_status: { ...cpu_mining_status, pool_status: updatedPoolStatus },
        };
    });
};

export const setPoolStatus = (pool_status: CpuMinerStatus['pool_status']) => {
    useMiningMetricsStore.setState((current) => ({ cpu_mining_status: { ...current.cpu_mining_status, pool_status } }));
};
export const handleConnectedPeersUpdate = (connected_peers: string[]) => {
    const wasNodeConnected = useMiningMetricsStore.getState().isNodeConnected;
    const isNodeConnected = connected_peers?.length > 0;
    useMiningMetricsStore.setState({ connected_peers, isNodeConnected });

    if (isNodeConnected && !useSetupStore.getState().appUnlocked) {
        useSetupStore.setState({ appUnlocked: true });
    }

    const miningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
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
};
export const handleBaseNodeStatusUpdate = (base_node_status: BaseNodeStatus) => {
    const displayBlockHeight = useBlockchainVisualisationStore.getState().displayBlockHeight;
    const setDisplayBlockHeight = useBlockchainVisualisationStore.getState().setDisplayBlockHeight;
    const isWalletScanning = useWalletStore.getState()?.wallet_scanning?.is_scanning;

    if (base_node_status.block_height && (!displayBlockHeight || isWalletScanning)) {
        // setting here before wallet initial scan, later updates via new block height handlers only
        setDisplayBlockHeight(base_node_status.block_height);
    }
    useMiningMetricsStore.setState({ base_node_status });
};
export const handleMiningModeChange = () => {
    useMiningMetricsStore.setState((currentState) => ({
        cpu_mining_status: {
            ...currentState.cpu_mining_status,
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
        },
        gpu_mining_status: {
            ...currentState.gpu_mining_status,
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
        },
    }));
};
