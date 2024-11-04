import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setAnimationState } from '@app/visuals.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';
import * as Sentry from '@sentry/react';

const useMiningMetricsUpdater = () => {
    const fetchTx = useFetchTx();
    const currentBlockHeight = useMiningStore((s) => s.base_node.block_height);
    const baseNodeConnected = useMiningStore((s) => s.base_node.is_connected);
    const setMiningMetrics = useMiningStore((s) => s.setMiningMetrics);
    const handleNewBlock = useBlockchainVisualisationStore((s) => s.handleNewBlock);

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
                await fetchTx();
                void handleNewBlock(blockHeight, isMining);
            }

            setMiningMetrics(metrics);
        } catch (e) {
            Sentry.captureException(e);
            console.error('Fetch mining metrics error: ', e);
        }
    }, [baseNodeConnected, currentBlockHeight, fetchTx, handleNewBlock, setMiningMetrics]);
};

export default useMiningMetricsUpdater;
