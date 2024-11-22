import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

import { TauriEvent } from '../types.ts';

import { useAppStateStore } from '../store/appStateStore.ts';

import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useHandleAirdropTokensRefresh } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

export function useSetUp() {
    const isInitializingRef = useRef(false);
    const handleRefreshAirdropTokens = useHandleAirdropTokensRefresh();

    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);
    const isAfterAutoUpdate = useAppStateStore((s) => s.isAfterAutoUpdate);
    const setSettingUpFinished = useAppStateStore((s) => s.setSettingUpFinished);
    const setSeenPermissions = useAirdropStore((s) => s.setSeenPermissions);
    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);
    const syncedAidropWithBackend = useAirdropStore((s) => s.syncedWithBackend);

    const fetchBackendInMemoryConfig = useAirdropStore((s) => s.fetchBackendInMemoryConfig);

    useEffect(() => {
        const refreshTokens = async () => {
            const backendInMemoryConfig = await fetchBackendInMemoryConfig();
            if (backendInMemoryConfig?.airdropApiUrl) {
                await handleRefreshAirdropTokens(backendInMemoryConfig.airdropApiUrl);
            }
        };
        refreshTokens();
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
    const handlePostSetup = useCallback(async () => {
        await fetchApplicationsVersionsWithRetry();
        await setSettingUpFinished();
    }, [fetchApplicationsVersionsWithRetry, setSettingUpFinished]);

    useEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    if (p.progress > 0) {
                        setSetupDetails(p.title, p.title_params, p.progress);
                    }
                    if (p.progress >= 1) {
                        handlePostSetup().finally(() => setSeenPermissions(true));
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        if (isAfterAutoUpdate && syncedAidropWithBackend && !isInitializingRef.current) {
            isInitializingRef.current = true;
            clearStorage();
            invoke('setup_application').catch((e) => {
                console.error(`Failed to setup application: ${e}`);
                setCriticalError(`Failed to setup application: ${e}`);
            });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        syncedAidropWithBackend,
        clearStorage,
        handlePostSetup,
        isAfterAutoUpdate,
        setCriticalError,
        setSeenPermissions,
        setSetupDetails,
    ]);
}
