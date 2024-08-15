import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';
import { preload } from '../visuals';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import useAppStateStore from '../store/appStateStore.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);

    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    // TODO: set up separate auto-miner listener
    const handleSetupListener = useCallback(
        async () =>
            listen('message', ({ event: e, payload: p }: TauriEvent) => {
                console.info('Setup Event:', e, p);
                switch (p.event_type) {
                    case 'setup_status':
                        console.info('Setup status:', p.title, p.progress);
                        setSetupDetails(p.title, p.progress);

                        if (p.progress >= 1) {
                            settingUpFinished();
                            setView('mining');
                        }
                        break;
                    default:
                        console.warn('Unknown tauri event: ', { e, p });
                        break;
                }
            }),
        [setSetupDetails, setView, settingUpFinished]
    );

    useEffect(() => {
        if (!startupInitiated.current) {
            preload?.();
            startupInitiated.current = true;

            invoke('setup_application').catch((e) => {
                console.error('Failed to setup application:', e);
            });
        }

        return () => {
            handleSetupListener().then((unlisten) => unlisten());
        };
    }, [handleSetupListener]);
}
