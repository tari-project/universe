import { MinerMetrics, TariWalletDetails } from '@app/types/app-status';
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
    const setWalletDetails = useWalletStore((s) => s.setWalletDetails);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const prevMetricsPayload = useRef<MinerMetrics>();
    const prevWalletPayload = useRef<TariWalletDetails>();

    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();

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
        const ul = listen('miner_metrics', ({ payload }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload as MinerMetrics, prevMetricsPayload.current);
            if (payloadChanged) {
                prevMetricsPayload.current = payload as MinerMetrics;
                handleMiningMetrics(payload as MinerMetrics);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [setupComplete, handleMiningMetrics]);
}
