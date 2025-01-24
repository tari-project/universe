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
        (newBlockHeight: number, newBlockTime: number) => {
            refreshCoinbaseTransactions()
                .then((latestTxs) => {
                    handleNewBlock(newBlockHeight, latestTxs?.[0])
                        .then(() => {
                            console.debug('new block THEN!');
                            prevTip.current = newBlockHeight;
                        })
                        .catch(() => {
                            console.debug('new block catch');
                            handleNoAnimation(newBlockHeight, newBlockTime);
                        });
                })
                .catch(() => {
                    console.debug('tx catch');
                    handleNoAnimation(newBlockHeight, newBlockTime);
                });
        },
        [handleNoAnimation]
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
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [handleMiningMetrics, setupComplete]);

    useEffect(() => {
        if (!setupComplete) return;
        // ONLY for new blocks
        const ul = listen('miner_metrics', ({ payload }: { payload: MinerMetrics }) => {
            const newBlockHeight = payload.base_node.block_height;
            const blockChanged = prevTip.current !== newBlockHeight;
            console.debug(`prevTip.current= `, prevTip.current);
            console.debug(`payload.base_node.block_height= `, payload.base_node.block_height);
            if (!blockChanged) return;
            const newBlockTime = payload.base_node.block_time;
            const isMining = payload.cpu?.mining.is_mining || payload.gpu?.mining.is_mining;

            if (!isMining && newBlockHeight && !displayBlockHeight) {
                handleNoAnimation(newBlockHeight, newBlockTime);
            }

            if (isMining) {
                const newBlockTimeout = setTimeout(
                    () => handleMiningChainTipChange(newBlockHeight, newBlockTime),
                    TX_CHECK_INTERVAL
                );
                return () => {
                    clearTimeout(newBlockTimeout);
                    prevTip.current = newBlockHeight;
                };
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [displayBlockHeight, handleMiningChainTipChange, handleNoAnimation, setupComplete]);
}
