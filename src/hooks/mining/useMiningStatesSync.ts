import { MinerMetrics } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect } from 'react';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const fetchTx = useFetchTx();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    const callIntervalItems = useCallback(async () => {
        if (setupProgress >= 0.75) {
            await fetchWalletDetails();
            await fetchTx();
        }
    }, [fetchWalletDetails, fetchTx, setupProgress]);

    // intervalItems
    useEffect(() => {
        const fetchInterval = setInterval(async () => {
            await callIntervalItems();
        }, 10500);

        return () => {
            clearInterval(fetchInterval);
        };
    }, [callIntervalItems]);

    useEffect(() => {
        if (isSettingUp) return;
        const ul = listen('miner_metrics', async ({ payload }) => {
            if (payload) {
                await handleMiningMetrics(payload as MinerMetrics);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [handleMiningMetrics, isSettingUp]);
}
