import { useAppStateStore } from '../store/appStateStore.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useWalletStore } from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useInterval } from './useInterval.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '../store/useGPUStatusStore.ts';
import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';
import { useMainAppVersion } from '@app/hooks/useVersions.ts';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

const INTERVAL = 1000;

export function useGetStatus() {
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setBalanceData = useWalletStore((state) => state.setBalanceData);
    const setCPUStatus = useCPUStatusStore((s) => s.setCPUStatus);
    const setGPUStatus = useGPUStatusStore((s) => s.setGPUStatus);
    const setBaseNodeStatus = useBaseNodeStatusStore((s) => s.setBaseNodeStatus);
    const setTelemetryMode = useAppStatusStore((s) => s.setTelemetryMode);
    const isSettingUp = useAppStateStore(useShallow((s) => s.isSettingUp));
    const appSetupFinished = useAppStateStore(useShallow((s) => s.settingUpFinished));
    const setupProgress = useAppStateStore(useShallow((s) => s.setupProgress));

    const { setError } = useAppStateStore((s) => ({
        setError: s.setError,
    }));
    const setMode = useAppStatusStore((s) => s.setMode);

    useMainAppVersion();

    useEffect(() => {
        invoke('get_telemetry_mode')
            .then((telemetryMode) => {
                console.info('Telemetry mode', telemetryMode);
                setTelemetryMode(telemetryMode);
            })
            .catch((e) => {
                console.error('Could not get telemetry mode', e);
            });
    }, [setTelemetryMode]);

    const invokeStatus = useCallback(async () => {
        await invoke('status')
            .then(async (status) => {
                if (status) {
                    setAppStatus(status);
                    setCPUStatus(status.cpu);
                    setGPUStatus(status.gpu);
                    setBaseNodeStatus(status.base_node);

                    const wallet_balance = status.wallet_balance;

                    setBalanceData(wallet_balance);
                    setMode(status.mode);

                    // It was moved from useSetup hook to here to ensure that when the setup is finished, we have all data in store
                    if (isSettingUp && setupProgress >= 1) {
                        appSetupFinished();
                    }
                }
            })
            .catch((e) => {
                console.error('Could not get status', e);
                setError(e.toString());
            });
    }, [
        isSettingUp,
        setAppStatus,
        setBalanceData,
        setBaseNodeStatus,
        setCPUStatus,
        setError,
        setGPUStatus,
        setMode,
        setupProgress,
        appSetupFinished,
    ]);

    useInterval(async () => invokeStatus(), INTERVAL);
}
