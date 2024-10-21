import useMiningMetricsUpdater from '@app/hooks/useMiningMetricsUpdater.ts';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';
import { useUiMiningStateMachine } from '@app/hooks/mining/useMiningUiStateMachine.ts';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useCallback, useEffect, useRef } from 'react';
import useEarningsRecap from '@app/hooks/mining/useEarningsRecap.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export default function useMiningStatesSync() {
    const fetchMiningMetrics = useMiningMetricsUpdater();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);
    const miningMode = useAppConfigStore((s) => s.mode);
    const prevMiningMode = useRef(miningMode || null);

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    const callIntervalItems = useCallback(async () => {
        await fetchMiningMetrics();
        await fetchWalletDetails();
    }, [fetchMiningMetrics, fetchWalletDetails]);

    useEffect(() => {
        // prevent delay in stats when switching modes
        if (miningMode && prevMiningMode.current !== miningMode) {
            callIntervalItems().then(() => {
                prevMiningMode.current = miningMode;
            });
        }
    }, [callIntervalItems, miningMode]);

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
