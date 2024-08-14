import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { useVisualisation } from './useVisualisation.ts';

export function useMining() {
    const { handlePause, handleStart } = useVisualisation();
    const isMiningEnabled = useAppStatusStore((s) => s.cpu?.is_mining_enabled);
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
        if (isMiningEnabled) {
            setMiningInitiated(true);
            await invoke('start_mining', {});
        }
    }, [isMiningEnabled, setMiningInitiated]);

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
