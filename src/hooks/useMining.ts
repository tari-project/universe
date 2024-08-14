import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '../store/appStateStore.ts';

export function useMining() {
    const { handlePause, handleStart } = useVisualisation();
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);

    const setMiningInitiated = useUIStore((s) => s.setMiningInitiated);

    const hasMiningStartedAtLeastOnce = useRef(false);

    useEffect(() => {
        const start = async () => {
            if (isMining) {
                await handleStart(hasMiningStartedAtLeastOnce.current);
                hasMiningStartedAtLeastOnce.current = true;
            }
        };

        return () => {
            start().then((s) => s);
        };
    }, [handleStart, isMining]);

    const startMining = useCallback(async () => {
        if (miningAllowed) {
            setMiningInitiated(true);
            await invoke('start_mining', {});
        }
    }, [miningAllowed, setMiningInitiated]);

    const stopMining = useCallback(async () => {
        const stop = await invoke('stop_mining', {});
        if (stop) {
            console.log(stop);
            await handlePause();
        }
    }, [handlePause]);

    return {
        startMining,
        stopMining,
        hasMiningBeenStopped: hasMiningStartedAtLeastOnce.current,
    };
}
