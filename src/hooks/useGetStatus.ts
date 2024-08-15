import useAppStateStore from '../store/appStateStore.ts';

import { invoke } from '@tauri-apps/api/tauri';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useUIStore } from '../store/useUIStore.ts';
import { useInterval } from './useInterval.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setMiningInitiated = useUIStore((s) => s.setMiningInitiated);

    const setBalance = useWalletStore((state) => state.setBalance);

    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setCPUStatus = useCPUStatusStore((s) => s.setCPUStatus);
    const setBaseNodeStatus = useBaseNodeStatusStore((s) => s.setBaseNodeStatus);
    const setError = useAppStateStore((s) => s.setError);
    const setMode = useAppStatusStore((s) => s.setMode);

    useInterval(
        () =>
            invoke('status')
                .then((status) => {
                    if (status) {
                        setAppStatus(status);
                        setCPUStatus(status.cpu);
                        console.debug(status.base_node);
                        setBaseNodeStatus(status.base_node);

                        if (status.cpu?.is_mining) {
                            setMiningInitiated(false);
                        }
                        const wallet_balance = status.wallet_balance;
                        const {
                            available_balance = 0,
                            timelocked_balance = 0,
                            pending_incoming_balance = 0,
                        } = wallet_balance || {};

                        setBalance(available_balance + timelocked_balance + pending_incoming_balance);
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
