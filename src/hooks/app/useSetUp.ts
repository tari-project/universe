import { useUIStore } from '@app/store/useUIStore';
import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../../types.ts';

import { setSetupComplete, setSetupDetails, useAppStateStore } from '../../store/appStateStore.ts';
import { fetchBackendInMemoryConfig } from '@app/store/useAirdropStore.ts';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

export function useSetUp() {
    const isInitializingRef = useRef(false);
    const adminShow = useUIStore((s) => s.adminShow);
    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);

    const handlePostSetup = useCallback(async () => {
        await setSetupComplete();
        await fetchApplicationsVersionsWithRetry();
    }, [fetchApplicationsVersionsWithRetry]);

    useEffect(() => {
        async function initWithToken() {
            const beConfig = await fetchBackendInMemoryConfig();
            if (beConfig?.airdropUrl) {
                await handleRefreshAirdropTokens(beConfig.airdropUrl);
            }
        }
        void initWithToken();
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
