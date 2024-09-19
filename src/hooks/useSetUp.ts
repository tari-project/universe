import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import { useAppStateStore } from '../store/appStateStore.ts';

import { useVersions } from '@app/hooks/useVersions.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);

    const setCpuMiner = useMiningStore((s) => s.setCpuMiner);
    const hasCheckedForUpdate = useAppStateStore((s) => s.isAfterAutoUpdate);
    useVersions();

    const clearStorage = useCallback(() => {
        // clear all storage except airdrop data
        const airdropStorage = localStorage.getItem('airdrop-store');
        localStorage.clear();
        if (airdropStorage) {
            localStorage.setItem('airdrop-store', airdropStorage);
        }

        const getCpuMiner = async () => {
            await invoke('get_randomx_miner').then((miner) => {
                setCpuMiner(miner);
            });
        };
        getCpuMiner();
    }, [setCpuMiner]);

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
        if (!startupInitiated.current && hasCheckedForUpdate) {
            clearStorage();
            invoke('setup_application')
                .then(() => {
                    startupInitiated.current = true;
                })
                .catch((e) => {
                    setError(`Failed to setup application: ${e}`);
                });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [clearStorage, hasCheckedForUpdate, setError, setSetupDetails, setView]);
}
