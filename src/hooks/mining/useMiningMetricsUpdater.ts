import { useCallback, useDeferredValue } from 'react';
import { MinerMetrics } from '@app/types/app-status';

import { useMiningStore } from '@app/store/useMiningStore';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export default function useMiningMetricsUpdater() {
    const fetchTx = useFetchTx();

    const setMiningMetrics = useMiningMetricsStore((s) => s.setMiningMetrics);
    const setBaseNodeMetrics = useMiningMetricsStore((s) => s.setBaseNodeMetrics);
    const currentBlockHeight = useMiningStore((s) => s.base_node_metrics.block_height);
    const handleNewBlock = useBlockchainVisualisationStore((s) => s.handleNewBlock);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    const deferredblock = useDeferredValue(currentBlockHeight);

    return useCallback(
        async (metrics: MinerMetrics) => {
            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
                if (isMining) {
                    await fetchTx();
                }
                const blockHeight = metrics.base_node_metrics.block_height;
                const isNewBlock = blockHeight > 0 && deferredblock > 0 && blockHeight > deferredblock;
                console.debug(`isNewBlock= ${isNewBlock}`);
                console.debug(`blockHeight= ${blockHeight}`);
                console.debug(`deferredBlock= ${deferredblock}`);
                if (isNewBlock) {
                    try {
                        await handleNewBlock(blockHeight, isMining);
                    } catch (_) {
                        setDisplayBlockHeight(blockHeight);
                    } finally {
                        setMiningMetrics(metrics);
                    }
                } else {
                    if (blockHeight && !displayBlockHeight) {
                        setDisplayBlockHeight(blockHeight);
                    }
                    setMiningMetrics(metrics);
                }
            }
        },
        [deferredblock, displayBlockHeight, fetchTx, handleNewBlock, setDisplayBlockHeight, setMiningMetrics]
    );
}
