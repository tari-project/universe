import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import useAppStateStore from '../store/appStateStore.ts';

import { useVersions } from '@app/hooks/useVersions.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setShowSplash = useUIStore((s) => s.setShowSplash);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const setError = useAppStateStore((s) => s.setError);
    const handleVisual = useVisualisation();

    useEffect(() => {
        const splashTimeout = setTimeout(() => {
            setShowSplash(false);
        }, 3500);
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            console.info('Setup Event:', e, p);
            switch (p.event_type) {
                case 'setup_status':
                    console.info('Setup status:', p.title, p.title_params, p.progress);
                    setSetupDetails(p.title, p.title_params, p.progress);
                    if (p.progress >= 1) {
                        settingUpFinished();
                        setView('mining');
                        handleVisual('showVisual');
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        if (!startupInitiated.current) {
            startupInitiated.current = true;
            invoke('setup_application').catch((e) => {
                setError(`Failed to setup application: ${e}`);
                settingUpFinished();
                handleVisual('showVisual');
                setView('mining');
            });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
            clearTimeout(splashTimeout);
        };
    }, [handleVisual, setError, setSetupDetails, setShowSplash, setView, settingUpFinished]);

    useVersions();
}
