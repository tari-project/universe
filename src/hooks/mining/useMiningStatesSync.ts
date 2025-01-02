import { MinerMetrics } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef } from 'react';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
    const prevPayload = useRef<MinerMetrics>();

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    // intervalItems
    useEffect(() => {
        if (setupProgress < 0.75) return;
        const fetchInterval = setInterval(fetchWalletDetails, 1000);
        return () => {
            clearInterval(fetchInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setupProgress]);

    useEffect(() => {
        if (isSettingUp) return;
        const ul = listen('miner_metrics', async ({ payload }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload as MinerMetrics, prevPayload.current);
            if (payloadChanged) {
                prevPayload.current = payload as MinerMetrics;
                await handleMiningMetrics(payload as MinerMetrics);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSettingUp]);
}
