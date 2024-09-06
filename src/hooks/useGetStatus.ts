import useAppStateStore from '../store/appStateStore.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useWalletStore } from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useInterval } from './useInterval.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '../store/useGPUStatusStore.ts';
import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';
import useMining from '@app/hooks/mining/useMining.ts';
import { useMainAppVersion } from '@app/hooks/useVersions.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setBalanceData = useWalletStore((state) => state.setBalanceData);
    const setCPUStatus = useCPUStatusStore((s) => s.setCPUStatus);
    const setGPUStatus = useGPUStatusStore((s) => s.setGPUStatus);
    const setBaseNodeStatus = useBaseNodeStatusStore((s) => s.setBaseNodeStatus);
    const setMiningControlsEnabled = useMiningStore((s) => s.setMiningControlsEnabled);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    const { setError } = useAppStateStore((s) => ({
        setError: s.setError,
    }));
    const setMode = useAppStatusStore((s) => s.setMode);

    useMainAppVersion();
    useMining();

    useInterval(
        () =>
            invoke('status')
                .then((status) => {
                    if (status) {
                        setAppStatus(status);
                        setCPUStatus(status.cpu);
                        setGPUStatus(status.gpu);
                        console.log(`status.mode= ${status.mode}`);
                        setBaseNodeStatus(status.base_node);

                        const wallet_balance = status.wallet_balance;

                        setBalanceData(wallet_balance);
                        setMode(status.mode);

                        const miningEnabled = status.cpu_mining_enabled || status.gpu_mining_enabled;
                        setMiningControlsEnabled(!isSettingUp && miningEnabled);
                    } else {
                        console.error('Could not get status');
                    }
                })
                .catch((e) => {
                    console.error('Could not get status', e);
                    setError(e.toString());
                }),
        INTERVAL
    );
}
