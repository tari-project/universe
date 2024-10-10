import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { setAnimationState } from '@app/visuals.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

const useMiningMetricsUpdater = () => {
    const baseNodeConnected = useMiningStore((s) => s.base_node.is_connected);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    return useCallback(async () => {
        try {
            const metrics = await invoke('get_miner_metrics');
            const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
            // Pause animation when lost connection to the Tari Network
            if (isMining && !metrics.base_node?.is_connected && baseNodeConnected) {
                setAnimationState('stop');
            } else if (isMining && metrics.base_node?.is_connected && !baseNodeConnected) {
                setAnimationState('start');
            }

            const setDisplayBlockHeight = useBlockchainVisualisationStore.getState().setDisplayBlockHeight;
            setDisplayBlockHeight(metrics.base_node.block_height);
            console.debug(metrics.base_node.block_height);
            setMiningMetrics(metrics);
        } catch (e) {
            console.error('Fetch mining metrics error: ', e);
        }
    }, [baseNodeConnected, setMiningMetrics]);
};

export default useMiningMetricsUpdater;
