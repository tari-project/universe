import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';
import useAppStateStore from '../store/appStateStore.ts';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppStatus } from '../types/app-status.ts';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setBalance = useWalletStore((state) => state.setBalance);
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    const unlistenPromise = listen(
        'message',
        ({ event, payload }: TauriEvent) => {
            console.log('some kind of event', event, payload);

            switch (payload.event_type) {
                case 'setup_status':
                    setSetupDetails(payload.title, payload.progress);
                    if (payload.progress >= 1.0) {
                        settingUpFinished();
                    }
                    break;
                default:
                    console.log('Unknown tauri event: ', { event, payload });
                    break;
            }
        }
    );

    useEffect(() => {
        if (!isSettingUp) {
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
                unlistenPromise.then((unlisten) => unlisten());
                clearInterval(intervalId);
            };
        }
    }, [isSettingUp]);
}
