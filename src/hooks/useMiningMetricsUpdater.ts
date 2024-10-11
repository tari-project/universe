import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { setAnimationState } from '@app/visuals.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

const useMiningMetricsUpdater = () => {
    const transactions = useWalletStore((s) => s.transactions);
    const currentBlockHeight = useMiningStore((s) => s.base_node.block_height);
    const baseNodeConnected = useMiningStore((s) => s.base_node.is_connected);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    const handleFail = useBlockchainVisualisationStore((s) => s.handleFail);

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

            const blockHeight = metrics.base_node.block_height;

            if (blockHeight > currentBlockHeight) {
                const lost = !transactions.find(
                    ({ message }) =>
                        message?.split(': ')[1] && message?.split(': ')[1] === currentBlockHeight.toString()
                );
                if (lost) {
                    await handleFail();
                }
            }

            const setDisplayBlockHeight = useBlockchainVisualisationStore.getState().setDisplayBlockHeight;
            setDisplayBlockHeight(blockHeight);
            setMiningMetrics(metrics);
        } catch (e) {
            console.error('Fetch mining metrics error: ', e);
        }
    }, [baseNodeConnected, currentBlockHeight, handleFail, setMiningMetrics, transactions]);
};

export default useMiningMetricsUpdater;
