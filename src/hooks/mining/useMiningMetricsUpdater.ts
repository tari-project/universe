import { useCallback, useDeferredValue } from 'react';
import { MinerMetrics } from '@app/types/app-status';
import { handleNewBlock, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export default function useMiningMetricsUpdater() {
    const setMiningMetrics = useMiningMetricsStore((s) => s.setMiningMetrics);
    const currentBlockHeight = useMiningMetricsStore((s) => s.base_node.block_height);

    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    const deferredblock = useDeferredValue(currentBlockHeight);

    return useCallback(
        async (metrics: MinerMetrics) => {
            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
                const blockHeight = metrics.base_node.block_height;
                const isNewBlock = blockHeight > 0 && deferredblock > 0 && blockHeight > deferredblock;

                if (isNewBlock) {
                    console.debug('isNewBlock', deferredblock, blockHeight);
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
        [deferredblock, displayBlockHeight, setDisplayBlockHeight, setMiningMetrics]
    );
}
