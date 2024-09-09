import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import useAppStateStore from '../store/appStateStore.ts';

import { useVersions } from '@app/hooks/useVersions.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { setupLogger } from '@app/utils/logger.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setShowSplash = useUIStore((s) => s.setShowSplash);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const setError = useAppStateStore((s) => s.setError);
    const setMiningControlsEnabled = useMiningStore((s) => s.setMiningControlsEnabled);
    const isAfterAutoUpdate = useAppStateStore((s) => s.isAfterAutoUpdate);
    const setAudioEnabled = useMiningStore((s) => s.setAudioEnabled);

    useVersions();

    useEffect(() => {
        setupLogger();
        const splashTimeout = setTimeout(() => {
            setShowSplash(false);
        }, 3500);

        return () => {
            clearTimeout(splashTimeout);
        };
    }, [setShowSplash]);

    useEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            console.info('Setup Event:', e, p);
            switch (p.event_type) {
                case 'setup_status':
                    // console.info('Setup status:', p.title, p.title_params, p.progress);
                    setSetupDetails(p.title, p.title_params, p.progress);
                    if (p.progress >= 1) {
                        settingUpFinished();
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
                    settingUpFinished();
                    setView('mining');
                });
                invoke('load_audio_config')
                    .then((isAudioEnabled) => {
                        setAudioEnabled(isAudioEnabled);
                    })
                    .catch((e) => {
                        setError(`Failed to load audio config: ${e}`);
                    });
            }
        }, 100);
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        setError,
        setMiningControlsEnabled,
        setSetupDetails,
        setView,
        settingUpFinished,
        isAfterAutoUpdate,
        setAudioEnabled,
    ]);
}
