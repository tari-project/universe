import useMiningMetricsUpdater from '@app/hooks/useMiningMetricsUpdater.ts';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';
import { useUiMiningStateMachine } from '@app/hooks/mining/useMiningUiStateMachine.ts';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useCallback, useEffect } from 'react';
import useEarningsRecap from '@app/hooks/mining/useEarningsRecap.ts';
import { useAppStateStore } from '@app/store/appStateStore';

export default function useMiningStatesSync() {
    const fetchMiningMetrics = useMiningMetricsUpdater();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    const callIntervalItems = useCallback(async () => {
        if (setupProgress >= 0.75) {
            await fetchWalletDetails();
        }
        if (!isSettingUp) {
            await fetchMiningMetrics();
        }
    }, [fetchMiningMetrics, fetchWalletDetails, isSettingUp, setupProgress]);

    // intervalItems
    useEffect(() => {
        const fetchInterval = setInterval(async () => {
            await callIntervalItems();
        }, 1000);

        return () => {
            clearInterval(fetchInterval);
        };
    }, [callIntervalItems]);
}
