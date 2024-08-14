import useAppStateStore from '../store/appStateStore.ts';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useUIStore } from '../store/useUIStore.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setMiningInitiated = useUIStore((s) => s.setMiningInitiated);

    const setBalance = useWalletStore((state) => state.setBalance);

    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setError = useAppStateStore((s) => s.setError);
    const setMode = useAppStatusStore((s) => s.setMode);

    useEffect(() => {
        const intervalId = setInterval(() => {
            invoke('status')
                .then((status) => {
                    if (status) {
                        setAppStatus(status);

                        if (
                            status.cpu?.is_mining_enabled &&
                            status.cpu.is_mining
                        ) {
                            setMiningInitiated(false);
                        }
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
                        setMode(status.mode);
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
    }, [setAppStatus, setBalance, setError, setMiningInitiated, setMode]);
}
