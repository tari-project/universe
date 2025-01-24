import { useCallback, useDeferredValue } from 'react';
import { MinerMetrics } from '@app/types/app-status';
import { handleNewBlock, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { setAnimationState } from '@app/visuals.ts';
import { refreshCoinbaseTransactions } from '@app/store/useWalletStore.ts';

const TX_CHECK_INTERVAL = 1000 * 10 * 2; // 20s
export default function useMiningMetricsUpdater() {
    const setMiningMetrics = useMiningMetricsStore((s) => s.setMiningMetrics);
    const currentBlockHeight = useMiningMetricsStore((s) => s.base_node.block_height);
    const baseNodeConnected = useMiningMetricsStore((s) => s.base_node.is_connected);

    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    const deferredblock = useDeferredValue(currentBlockHeight);

    return useCallback(
        (metrics: MinerMetrics) => {
            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;

                if (isMining) {
                    if (!metrics.base_node?.is_connected && baseNodeConnected) {
                        setAnimationState('stop');
                    }
                    if (metrics.base_node?.is_connected && !baseNodeConnected) {
                        setAnimationState('start');
                    }
                }

                const blockHeight = metrics.base_node.block_height;
                const isNewBlock = blockHeight > 0 && deferredblock > 0 && blockHeight > deferredblock;

                if (!isNewBlock && blockHeight && !displayBlockHeight) {
                    setMiningMetrics(metrics);
                    return;
                }

                if (isNewBlock && !isMining) {
                    setDisplayBlockHeight(blockHeight);
                    setMiningMetrics(metrics);
                    return;
                }

                if (isNewBlock && isMining) {
                    const newBlockMiningTimeout = setTimeout(async () => {
                        try {
                            const latestTxs = await refreshCoinbaseTransactions();
                            if (latestTxs?.length) {
                                console.debug(latestTxs);
                                await handleNewBlock(blockHeight, latestTxs[0]);
                            }
                        } finally {
                            setMiningMetrics(metrics);
                        }
                    }, TX_CHECK_INTERVAL);

                    return () => {
                        clearTimeout(newBlockMiningTimeout);
                    };
                }
            }
        },
        [baseNodeConnected, deferredblock, displayBlockHeight, setDisplayBlockHeight, setMiningMetrics]
    );
}
