import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useUIStore } from '@app/store/useUIStore';
import { TauriEvent } from '../../types.ts';
import {
    setSetupComplete,
    setSetupProgress,
    setSetupTitle,
    setSetupTitleParams,
} from '@app/store/actions/setupStoreActions.ts';
import { fetchApplicationsVersionsWithRetry } from '@app/store/actions/appStateStoreActions.ts';

export function useSetUp() {
    const setupProgressRef = useRef(0);
    const isInitializingRef = useRef(false);

    const adminShow = useUIStore((s) => s.adminShow);
    const handlePostSetup = useCallback(async () => {
        await setSetupComplete();
        await fetchApplicationsVersionsWithRetry();
    }, []);

    useEffect(() => {
        if (adminShow === 'setup') return;
        const unlistenPromise = listen('setup_message', async ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    if (p.progress >= 0) {
                        setSetupTitle(p.title);
                        setSetupTitleParams(p.title_params);
                        setSetupProgress(p.progress);
                    }
                    if (p.progress >= 1) {
                        await handlePostSetup();
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
            if (setupProgressRef.current !== p.progress) {
                console.info('Received tauri event: ', { e, p });
                setupProgressRef.current = p.progress;
            }
        });

        if (!isInitializingRef.current) {
            function clearStorage() {
                // clear all storage except airdrop data
                const airdropStorage = localStorage.getItem('airdrop-store');
                localStorage.clear();
                if (airdropStorage) {
                    localStorage.setItem('airdrop-store', airdropStorage);
                }
            }
            isInitializingRef.current = true;
            clearStorage();
        }

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [adminShow, handlePostSetup]);
}
