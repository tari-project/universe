import { MinerMetrics } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef } from 'react';

import { useAppStateStore } from '@app/store/appStateStore';

import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useMiningMetricsUpdater from './useMiningMetricsUpdater.ts';
import useEarningsRecap from './useEarningsRecap.ts';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

export function useMiningStatesSync() {
    const handleMiningMetrics = useMiningMetricsUpdater();
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const prevMetricsPayload = useRef<MinerMetrics>();

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

    useEffect(() => {
        if (!setupComplete) return;
        const ul = listen('miner_metrics', async ({ payload }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload as MinerMetrics, prevMetricsPayload.current);
            if (payloadChanged) {
                prevMetricsPayload.current = payload as MinerMetrics;
                await handleMiningMetrics(payload as MinerMetrics);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [setupComplete, handleMiningMetrics]);
}
