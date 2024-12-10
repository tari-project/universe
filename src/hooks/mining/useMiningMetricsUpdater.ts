import { useCallback } from 'react';
import { MinerMetrics } from '@app/types/app-status';

import { setAnimationState } from '@app/visuals.ts';
import { useMiningStore } from '@app/store/useMiningStore';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

import useFetchTx from './useTransactions.ts';

export default function useMiningMetricsUpdater() {
    const fetchTx = useFetchTx();
    const currentBlockHeight = useMiningStore((s) => s.base_node.block_height);
    const baseNodeConnected = useMiningStore((s) => s.base_node.is_connected);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    const handleNewBlock = useBlockchainVisualisationStore((s) => s.handleNewBlock);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    return useCallback(
        async (metrics: MinerMetrics) => {
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
                    try {
                        fetchTx()
                            .then(async () => {
                                await handleNewBlock(blockHeight, isMining);
                            })
                            .catch(() => {
                                setDisplayBlockHeight(blockHeight);
                            });
                    } catch (_) {
                        setDisplayBlockHeight(blockHeight);
                    }
                } else {
                    if (blockHeight && !displayBlockHeight) {
                        setDisplayBlockHeight(blockHeight);
                    }
                }
                setMiningMetrics(metrics);
            }
        },
        [
            baseNodeConnected,
            currentBlockHeight,
            displayBlockHeight,
            fetchTx,
            handleNewBlock,
            setDisplayBlockHeight,
            setMiningMetrics,
        ]
    );
}
