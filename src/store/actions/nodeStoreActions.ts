import { BaseNodeStatus } from '@app/types/app-status.ts';

import { setAnimationState } from '@tari-project/tari-tower';
import { useNodeStore } from '../useNodeStore.ts';
import { useMiningStore } from '../useMiningStore.ts';

export const handleBaseNodeStatusUpdate = (base_node_status: BaseNodeStatus) => {
    const wasNodeConnected = useNodeStore.getState().isNodeConnected;
    const isNodeConnected = base_node_status.num_connections > 0;
    useNodeStore.setState((c) => ({ ...c, base_node_status, isNodeConnected }));

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
