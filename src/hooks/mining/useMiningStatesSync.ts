import { MinerMetrics } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

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
