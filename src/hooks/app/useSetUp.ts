import { useUIStore } from '@app/store/useUIStore';
import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../../types.ts';

import { useAppStateStore } from '../../store/appStateStore.ts';

export function useSetUp() {
    const isInitializingRef = useRef(false);
    const adminShow = useUIStore((s) => s.adminShow);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setSettingUpFinished = useAppStateStore((s) => s.setSettingUpFinished);
    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);

    const clearStorage = useCallback(() => {
        // clear all storage except airdrop data
        const airdropStorage = localStorage.getItem('airdrop-store');
        localStorage.clear();
        if (airdropStorage) {
            localStorage.setItem('airdrop-store', airdropStorage);
        }
    }, []);

    const handlePostSetup = useCallback(async () => {
        await fetchApplicationsVersionsWithRetry();
        await setSettingUpFinished();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (adminShow === 'setup') return;
        const unlistenPromise = listen('setup_message', async ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    if (p.progress > 0) {
                        setSetupDetails(p.title, p.title_params, p.progress);
                    }
                    if (p.progress >= 1) {
                        await handlePostSetup();
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });

        if (!isInitializingRef.current) {
            isInitializingRef.current = true;
            clearStorage();
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [clearStorage, handlePostSetup, adminShow, setSetupDetails]);
}
