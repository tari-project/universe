import { MinerMetrics, TariWalletDetails } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';

import { refreshCoinbaseTransactions, useWalletStore } from '@app/store/useWalletStore.ts';
import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

import { handleNewBlock, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

const TX_CHECK_INTERVAL = 1000 * 10; // 20s

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);
    const setBlockHeight = useMiningMetricsStore((s) => s.setBlockHeight);
    const setBlockTime = useMiningMetricsStore((s) => s.setBlockTime);
    const setWalletDetails = useWalletStore((s) => s.setWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const prevMetricsPayload = useRef<MinerMetrics>();
    const prevWalletPayload = useRef<TariWalletDetails>();
    const prevTip = useRef<number>();

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    const handleNoAnimation = useCallback(
        (newBlockHeight: number, newBlockTime: number) => {
            setDisplayBlockHeight(newBlockHeight);
            setBlockHeight(newBlockHeight);
            setBlockTime(newBlockTime);
            prevTip.current = newBlockHeight;
        },
        [setBlockHeight, setBlockTime, setDisplayBlockHeight]
    );

    const handleMiningChainTipChange = useCallback(
        async (newBlockHeight: number, newBlockTime: number) => {
            const latestTxs = await refreshCoinbaseTransactions();

            handleNewBlock(newBlockHeight, latestTxs?.[0])
                .then(() => {
                    console.debug('new block THEN!', latestTxs?.[0]?.mined_in_block_height, newBlockHeight);
                    setDisplayBlockHeight(newBlockHeight);
                    prevTip.current = newBlockHeight;
                })
                .catch(() => {
                    console.debug('new block catch');
                    handleNoAnimation(newBlockHeight, newBlockTime);
                });
        },
        [handleNoAnimation, setDisplayBlockHeight]
    );

    useEffect(() => {
        if (!setupComplete && setupProgress < 0.75) return;
        const ul = listen('wallet_details', ({ payload }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload as TariWalletDetails, prevWalletPayload.current);
            if (payloadChanged) {
                prevWalletPayload.current = payload as TariWalletDetails;
                setWalletDetails(payload as TariWalletDetails);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [setWalletDetails, setupComplete, setupProgress]);

    useEffect(() => {
        if (!setupComplete) return;
        const ul = listen('miner_metrics', ({ payload }: { payload: MinerMetrics }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload, prevMetricsPayload.current);
            if (payloadChanged) {
                prevMetricsPayload.current = payload;
                handleMiningMetrics(payload);

                const isMining = payload.cpu?.mining.is_mining || payload.gpu?.mining.is_mining;
                const newBlockHeight = payload.base_node.block_height;
                if (!isMining && newBlockHeight && !displayBlockHeight) {
                    const newBlockTime = payload.base_node.block_time;
                    handleNoAnimation(newBlockHeight, newBlockTime);
                }
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [displayBlockHeight, handleMiningMetrics, handleNoAnimation, setupComplete]);

    useEffect(() => {
        if (!setupComplete) return;
        // ONLY for new blocks while mining
        const ul = listen('miner_metrics_block_height', async ({ payload }: { payload: MinerMetrics }) => {
            const isMining = payload.cpu?.mining.is_mining || payload.gpu?.mining.is_mining;
            const newBlockHeight = payload.base_node.block_height;
            const blockChanged = prevTip.current !== newBlockHeight;
            if (!blockChanged || !isMining) return;
            console.debug(`prev | new`, prevTip.current, payload.base_node.block_height);
            const newBlockTime = payload.base_node.block_time;
            const latestTxs = await refreshCoinbaseTransactions();
            const interval = latestTxs?.[0]?.mined_in_block_height === newBlockHeight ? 1 : TX_CHECK_INTERVAL;
            setTimeout(async () => await handleMiningChainTipChange(newBlockHeight, newBlockTime), interval);
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [displayBlockHeight, handleMiningChainTipChange, handleNoAnimation, setupComplete]);
}
