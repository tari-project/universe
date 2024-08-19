import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '../store/appStateStore.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';

export function useMining() {
    const { handlePause, handleStart } = useVisualisation();
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;
    const isMining = useCPUStatusStore((s) => s.is_mining);

    const setMiningInitiated = useUIStore((s) => s.setMiningInitiated);

    const hasMiningStartedAtLeastOnce = useRef(false);

    useEffect(() => {
        if (isMining) {
            handleStart(hasMiningStartedAtLeastOnce.current);
            hasMiningStartedAtLeastOnce.current = true;
        }
    }, [handleStart, isMining]);

    const startMining = useCallback(async () => {
        if (miningAllowed) {
            setMiningInitiated(true);
            await invoke('start_mining', {}).then(() => {
                console.info(`mining started`);
            });
        }
    }, [miningAllowed, setMiningInitiated]);

    const stopMining = useCallback(async () => {
        await invoke('stop_mining', {}).then(async () => {
            console.info(`mining stopped`);
            await handlePause();
        });
    }, [handlePause]);

    return {
        startMining,
        stopMining,
        hasMiningBeenStopped: hasMiningStartedAtLeastOnce.current,
    };
}
