import { useLayoutEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import { useAppStateStore } from '../store/appStateStore.ts';

import { useVersions } from '@app/hooks/useVersions.ts';

import { useShallow } from 'zustand/react/shallow';
import { setAnimationState } from '@app/visuals.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setError = useAppStateStore((s) => s.setError);

    const isAfterAutoUpdate = useAppStateStore(useShallow((s) => s.isAfterAutoUpdate));

    useVersions();

    useLayoutEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            console.info('Setup Event:', e, p);
            switch (p.event_type) {
                case 'setup_status':
                    setSetupDetails(p.title, p.title_params, p.progress);
                    if (p.progress >= 1) {
                        setAnimationState('showVisual');
                        setView('mining');
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        const intervalId = setInterval(() => {
            if (!startupInitiated.current && isAfterAutoUpdate) {
                clearInterval(intervalId);
                startupInitiated.current = true;
                invoke('setup_application').catch((e) => {
                    setError(`Failed to setup application: ${e}`);
                    setView('mining');
                });
            }
        }, 100);
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [isAfterAutoUpdate, setError, setSetupDetails, setView]);
}
