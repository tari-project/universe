import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { setAnimationState } from '@app/visuals.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';
import * as Sentry from '@sentry/react';

export default function useMiningMetricsUpdater() {
    const fetchTx = useFetchTx();
    const currentBlockHeight = useMiningStore((s) => s.base_node.block_height);
    const baseNodeConnected = useMiningStore((s) => s.base_node.is_connected);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    const handleNewBlock = useBlockchainVisualisationStore((s) => s.handleNewBlock);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);
    const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);

    return useCallback(async () => {
        if (isFetchingMetrics) return;
        try {
            setIsFetchingMetrics(true);
            const metrics = await invoke('get_miner_metrics');

            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
                // Pause animation when lost connection to the Tari Network
                if (isMining && !metrics.base_node?.is_connected && baseNodeConnected) {
                    setAnimationState('stop');
                } else if (isMining && metrics.base_node?.is_connected && !baseNodeConnected) {
                    setAnimationState('start');
                }

                const blockHeight = metrics.base_node.block_height;
                if (blockHeight > 0 && currentBlockHeight > 0 && blockHeight > currentBlockHeight) {
                    await fetchTx();
                    await handleNewBlock(blockHeight, isMining);
                } else {
                    if (blockHeight && !displayBlockHeight) {
                        setDisplayBlockHeight(blockHeight);
                    }
                }
                setMiningMetrics(metrics);
                setIsFetchingMetrics(false);
            }
        } catch (e) {
            Sentry.captureException(e);
            console.error('Fetch mining metrics error: ', e);
            setIsFetchingMetrics(false);
        }
    }, [
        baseNodeConnected,
        currentBlockHeight,
        displayBlockHeight,
        fetchTx,
        handleNewBlock,
        isFetchingMetrics,
        setDisplayBlockHeight,
        setMiningMetrics,
    ]);
}
