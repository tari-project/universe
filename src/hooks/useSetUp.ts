import { useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import { useAppStateStore } from '../store/appStateStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { setAnimationState } from '@app/visuals.ts';

import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { ExternalDependency } from '@app/types/app-status.ts';
import { useHandleAirdropTokensRefresh } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

export function useSetUp() {
    const setView = useUIStore((s) => s.setView);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);
    const { setShowExternalDependenciesDialog } = useUIStore();
    const isAfterAutoUpdate = useAppStateStore((s) => s.isAfterAutoUpdate);
    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const setSeenPermissions = useAirdropStore((s) => s.setSeenPermissions);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);
    const { backendInMemoryConfig } = useAirdropStore();
    const handleRefreshAirdropTokens = useHandleAirdropTokensRefresh();

    const { loadExternalDependencies } = useAppStateStore();

    useEffect(() => {
        const unlistenPromise = listen<ExternalDependency[]>('missing-applications', (event) => {
            const missingDependencies = event.payload;
            loadExternalDependencies(missingDependencies);
            setShowExternalDependenciesDialog(true);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [loadExternalDependencies, setShowExternalDependenciesDialog]);

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (backendInMemoryConfig?.airdropApiUrl) {
            handleRefreshAirdropTokens(backendInMemoryConfig.airdropApiUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backendInMemoryConfig?.airdropApiUrl]);

    const clearStorage = useCallback(() => {
        // clear all storage except airdrop data
        const airdropStorage = localStorage.getItem('airdrop-store');
        localStorage.clear();
        if (airdropStorage) {
            localStorage.setItem('airdrop-store', airdropStorage);
        }
    }, []);

    useEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    setSetupDetails(p.title, p.title_params, p.progress);
                    if (p.progress >= 1) {
                        settingUpFinished();
                        fetchApplicationsVersionsWithRetry();
                        setView('mining');
                        setAnimationState('showVisual');
                        setSeenPermissions(true);
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
        setSeenPermissions,
        backendInMemoryConfig?.airdropApiUrl,
        handleRefreshAirdropTokens,
    ]);
}
