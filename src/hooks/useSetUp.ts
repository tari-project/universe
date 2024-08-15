import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';
import { preload } from '../visuals';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import useAppStateStore from '../store/appStateStore.ts';
import { useMining } from './useMining.ts';

import { useAppStatusStore } from '../store/useAppStatusStore.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);

    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    // TODO: set up separate auto-miner listener
    const autoMiningEnabled = useAppStatusStore((s) => s.auto_mining);
    const { startMining, stopMining } = useMining();

    useEffect(() => {
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
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
                //Auto Miner
                case 'user_idle':
                    if (!autoMiningEnabled) return;
                    startMining().then(() => {
                        console.debug('Mining started');
                    });
                    break;
                case 'user_active':
                    if (!autoMiningEnabled) return;
                    stopMining().then(() => {
                        console.debug('Mining stopped');
                    });
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        if (!startupInitiated.current) {
            preload?.();
            startupInitiated.current = true;

            invoke('setup_application').catch((e) => {
                console.error('Failed to setup application:', e);
            });
        }

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [autoMiningEnabled, setSetupDetails, setView, settingUpFinished, startMining, stopMining]);
}
