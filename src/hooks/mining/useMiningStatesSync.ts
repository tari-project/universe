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

const TX_CHECK_INTERVAL = 1000 * 10 * 2; // 20s

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

    const handleChainTip = useCallback(
        (metrics: MinerMetrics) => {
            const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
            const newBlockHeight = metrics.base_node.block_height;

            if (!isMining && newBlockHeight && !displayBlockHeight) {
                setDisplayBlockHeight(newBlockHeight);
                setBlockHeight(newBlockHeight);
                setBlockTime(metrics.base_node.block_time);
                return;
            }

            if (isMining) {
                const newBlockMiningTimeout = setTimeout(async () => {
                    try {
                        const latestTxs = await refreshCoinbaseTransactions();
                        if (latestTxs?.length) {
                            await handleNewBlock(newBlockHeight, latestTxs[0]);
                        }
                    } catch (_) {
                        setDisplayBlockHeight(newBlockHeight);
                        setBlockHeight(newBlockHeight);
                        setBlockTime(metrics.base_node.block_time);
                    } finally {
                        prevTip.current = newBlockHeight;
                    }
                }, TX_CHECK_INTERVAL);

                return () => {
                    clearTimeout(newBlockMiningTimeout);
                };
            }
        },
        [displayBlockHeight, setBlockHeight, setBlockTime, setDisplayBlockHeight]
    );

    useEffect(() => {
        if (setupProgress < 0.75) return;
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
    }, [setWalletDetails, setupProgress]);

    useEffect(() => {
        if (!setupComplete) return;
        const ul = listen('miner_metrics', ({ payload }: { payload: MinerMetrics }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload, prevMetricsPayload.current);
            if (payloadChanged) {
                prevMetricsPayload.current = payload;
                handleMiningMetrics(payload);
            }

            const blockChanged = prevTip.current !== payload.base_node.block_height;
            if (blockChanged) {
                handleChainTip(payload);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [setupComplete, handleMiningMetrics, handleChainTip]);
}
