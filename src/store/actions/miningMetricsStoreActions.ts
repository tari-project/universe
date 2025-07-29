import { BaseNodeStatus, CpuMinerStatus, GpuDevice, GpuMinerStatus } from '@app/types/app-status.ts';

import { setAnimationState } from '@tari-project/tari-tower';
import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';
import { useMiningStore } from '../useMiningStore.ts';

export const setGpuDevices = (gpu_devices: GpuDevice[]) => {
    useMiningMetricsStore.setState({ gpu_devices });
};
export const setGpuMiningStatus = (gpu_mining_status: GpuMinerStatus) => {
    useMiningMetricsStore.setState((c) => ({ ...c, gpu_mining_status }));
};
export const setCpuMiningStatus = (cpu_mining_status: CpuMinerStatus) => {
    useMiningMetricsStore.setState((c) => ({ ...c, cpu_mining_status }));
};

export const handleConnectedPeersUpdate = (connected_peers: string[]) => {
    const wasNodeConnected = useMiningMetricsStore.getState().isNodeConnected;
    const isNodeConnected = connected_peers?.length > 0;
    useMiningMetricsStore.setState((c) => ({ ...c, connected_peers, isNodeConnected }));

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
    useMiningMetricsStore.setState((c) => ({ ...c, base_node_status }));
};
