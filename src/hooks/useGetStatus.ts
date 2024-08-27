import useAppStateStore from '../store/appStateStore.ts';

import { invoke } from '@tauri-apps/api/tauri';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useInterval } from './useInterval.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';
import useMining from '@app/hooks/mining/useMining.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setBalanceData = useWalletStore((state) => state.setBalanceData);
    const setCPUStatus = useCPUStatusStore((s) => s.setCPUStatus);
    const setBaseNodeStatus = useBaseNodeStatusStore((s) => s.setBaseNodeStatus);
    const setError = useAppStateStore((s) => s.setError);
    const setMode = useAppStatusStore((s) => s.setMode);

    useMining();

    useInterval(
        () =>
            invoke('status')
                .then((status) => {
                    if (status) {
                        // console.info('Status:', status);

                        setAppStatus(status);
                        setCPUStatus(status.cpu);
                        setBaseNodeStatus(status.base_node);

                        const wallet_balance = status.wallet_balance;

                        setBalanceData(wallet_balance);
                        setMode(status.mode);
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
