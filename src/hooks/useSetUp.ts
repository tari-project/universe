import { useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import { useAppStateStore } from '../store/appStateStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { setAnimationState } from '@app/visuals.ts';
import useWalletDetailsUpdater from './useWalletUpdater.ts';

export function useSetUp() {
    const setView = useUIStore((s) => s.setView);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);
    const isAfterAutoUpdate = useAppStateStore((s) => s.isAfterAutoUpdate);
    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clearStorage = useCallback(() => {
        // clear all storage except airdrop data
        const airdropStorage = localStorage.getItem('airdrop-store');
        localStorage.clear();
        if (airdropStorage) {
            localStorage.setItem('airdrop-store', airdropStorage);
        }
    }, []);

    // fetch initial wallet details
    useWalletDetailsUpdater();

    useEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    setSetupDetails(p.title, p.title_params, p.progress);
                    if (p.progress >= 1) {
                        setView('mining');
                        setAnimationState('showVisual');
                        settingUpFinished();
                        fetchApplicationsVersionsWithRetry();
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        if (isAfterAutoUpdate) {
            clearStorage();
            invoke('setup_application').catch((e) => {
                setCriticalError(`Failed to setup application: ${e}`);
                setView('mining');
            });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        clearStorage,
        fetchApplicationsVersionsWithRetry,
        isAfterAutoUpdate,
        setError,
        setSetupDetails,
        setView,
        settingUpFinished,
        setCriticalError,
    ]);
}
