import useAppStateStore from '../store/appStateStore.ts';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppStatus } from '../types/app-status.ts';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';

const INTERVAL = 100000;

export function useGetStatus() {
    const setBalance = useWalletStore((state) => state.setBalance);
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setError = useAppStateStore((s) => s.setError);

    useEffect(() => {
        const intervalId = setInterval(() => {
            invoke<AppStatus>('status', {})
                .then((status: AppStatus) => {
                    console.debug('Status', status);
                    if (status) {
                        setAppStatus(status);
                        const wallet_balance = status.wallet_balance;
                        const {
                            available_balance = 0,
                            timelocked_balance = 0,
                            pending_incoming_balance = 0,
                        } = wallet_balance || {};

                        setBalance(
                            available_balance +
                                timelocked_balance +
                                pending_incoming_balance
                        );
                    } else {
                        console.error('Could not get status');
                    }
                })
                .catch((e) => {
                    console.error('Could not get status', e);
                    setError(e.toString());
                });
        }, INTERVAL);
        return () => {
            clearInterval(intervalId);
        };
    }, []);
}
