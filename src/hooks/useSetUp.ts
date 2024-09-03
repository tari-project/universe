import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../types.ts';

import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore.ts';
import useAppStateStore from '../store/appStateStore.ts';

import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useVersions } from '@app/hooks/useVersions.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { setAnimationState } from '@app/visuals.ts';

export function useSetUp() {
    const startupInitiated = useRef(false);
    const setView = useUIStore((s) => s.setView);
    const setShowSplash = useUIStore((s) => s.setShowSplash);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const settingUpFinished = useAppStateStore((s) => s.settingUpFinished);
    const setError = useAppStateStore((s) => s.setError);
    const setCurrentUserInactivityDuration = useAppStatusStore((s) => s.setCurrentUserInactivityDuration);
    // TODO: set up separate auto-miner listener
    const autoMiningEnabled = useAppStatusStore((s) => s.auto_mining);
    const { startMining, stopMining } = useMiningControls();

    useEffect(() => {
        setTimeout(() => {
            setShowSplash(false);
        }, 3500);
        const unlistenPromise = listen('message', ({ event: e, payload: p }: TauriEvent) => {
            console.info('Setup Event:', e, p);
            switch (p.event_type) {
                case 'setup_status':
                    console.info('Setup status:', p.title, p.progress);
                    setSetupDetails(p.title, p.progress);
                    if (p.progress >= 1) {
                        if (autoMiningEnabled) invoke('set_auto_mining', { autoMining: true });
                        settingUpFinished();
                        setView('mining');
                        setAnimationState('showVisual');
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
                case 'current_timeout_duration':
                    setCurrentUserInactivityDuration(p.duration);
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
                setAnimationState('showVisual');
                setView('mining');
            });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        autoMiningEnabled,
        setCurrentUserInactivityDuration,
        setSetupDetails,
        setView,
        settingUpFinished,
        startMining,
        stopMining,
        setShowSplash,
        setError,
    ]);

    useVersions();
}
