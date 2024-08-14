import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { useAppStatusStore } from '../store/useAppStatusStore';

export function useMining() {
    const isMiningEnabled = useAppStatusStore((s) => s.cpu?.is_mining_enabled);
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);
    const isMiningSwitchingState = useUIStore((s) => s.isMiningSwitchingState);
    const setMiningInitiated = useUIStore((s) => s.setMiningInitiated);

    const hasMiningStartedAtLeastOnce = useRef(false);

    useEffect(() => {
        if (isMiningEnabled && isMining) {
            hasMiningStartedAtLeastOnce.current = true;
            return;
        }
    }, [isMiningEnabled, isMining, isMiningSwitchingState]);

    const startMining = useCallback(async () => {
        await invoke('start_mining', {});
    }, []);

    const stopMining = useCallback(async () => {
        setMiningInitiated(true);
        await invoke('stop_mining', {});
    }, [setMiningInitiated]);

    return {
        startMining,
        stopMining,
        hasMiningBeenStopped: hasMiningStartedAtLeastOnce.current,
    };
}
