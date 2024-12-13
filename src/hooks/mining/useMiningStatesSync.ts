import { MinerMetrics } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    // intervalItems
    useEffect(() => {
        const fetchInterval = setInterval(async () => {
            if (setupProgress >= 0.75) {
                await fetchWalletDetails();
            }
        }, 1500);

        return () => {
            clearInterval(fetchInterval);
        };
    }, [fetchWalletDetails, setupProgress]);

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
