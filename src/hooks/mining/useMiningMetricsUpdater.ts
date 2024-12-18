import { useCallback } from 'react';
import { MinerMetrics } from '@app/types/app-status';

import { useMiningStore } from '@app/store/useMiningStore';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';

export default function useMiningMetricsUpdater() {
    const fetchTx = useFetchTx();
    const currentBlockHeight = useMiningStore((s) => s.base_node.block_height);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    const handleNewBlock = useBlockchainVisualisationStore((s) => s.handleNewBlock);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    return useCallback(
        async (metrics: MinerMetrics) => {
            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
                if (isMining) {
                    await fetchTx();
                }
                const blockHeight = metrics.base_node.block_height;
                const isNewBlock = blockHeight > 0 && currentBlockHeight > 0 && blockHeight > currentBlockHeight;
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
        [currentBlockHeight, displayBlockHeight, fetchTx, handleNewBlock, setDisplayBlockHeight, setMiningMetrics]
    );
}
