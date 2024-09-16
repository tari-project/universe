import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import { useAppStateStore } from '../store/appStateStore.ts';

import { useVersions } from '@app/hooks/useVersions.ts';

import { useShallow } from 'zustand/react/shallow';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);
    const isAfterAutoUpdate = useAppStateStore(useShallow((s) => s.isAfterAutoUpdate));

    const setMiningInitiated = useMiningStore(useShallow((s) => s.setMiningInitiated));
    const setMiningControlsEnabled = useMiningStore(useShallow((s) => s.setMiningControlsEnabled));
    useVersions();

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
                        setView('mining');
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        const intervalId = setInterval(async () => {
            if (!startupInitiated.current && isAfterAutoUpdate) {
                clearInterval(intervalId);
                startupInitiated.current = true;
                clearStorage();
                invoke('setup_application').catch((e) => {
                    setError(`Failed to setup application: ${e}`);
                    setView('mining');
                });
            }
        }, 100);
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        clearStorage,
        isAfterAutoUpdate,
        setError,
        setMiningControlsEnabled,
        setMiningInitiated,
        setSetupDetails,
        setView,
    ]);
}
