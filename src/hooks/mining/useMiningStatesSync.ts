import useMiningMetricsUpdater from '@app/hooks/useMiningMetricsUpdater.ts';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';
import { useUiMiningStateMachine } from '@app/hooks/mining/useMiningUiStateMachine.ts';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useCallback, useEffect } from 'react';

export default function useMiningStatesSync() {
    const fetchMiningMetrics = useMiningMetricsUpdater();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);

    useBlockInfo();
    useUiMiningStateMachine();

    const callIntervalItems = useCallback(async () => {
        await fetchMiningMetrics();
        await fetchWalletDetails();
    }, [fetchMiningMetrics, fetchWalletDetails]);

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
