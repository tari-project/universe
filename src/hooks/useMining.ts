import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { useAppStatusStore } from '../store/useAppStatusStore';

export function useMining() {
    const isMiningEnabled = useAppStatusStore((s) => s.cpu?.is_mining_enabled);
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);
    const isMiningSwitchingState = useUIStore((s) => s.isMiningSwitchingState);

    const setIsMiningSwitchingState = useUIStore(
        (s) => s.setIsMiningSwitchingState
    );
    const setBackground = useUIStore((s) => s.setBackground);

    const hasMiningStartedAtLeastOnce = useRef(false);

    useEffect(() => {
        if (isMiningSwitchingState) return;

        if (isMiningEnabled && isMining) {
            hasMiningStartedAtLeastOnce.current = true;
            return;
        }

        if (!isMiningEnabled) {
            setBackground('idle');
            return;
        }
    }, [isMiningEnabled, isMining, isMiningSwitchingState]);

    const startMining = useCallback(async () => {
        setIsMiningSwitchingState(true);
        try {
            await invoke('start_mining', {});
        } catch (e) {
            console.error('Could not start mining', e);
        } finally {
            setIsMiningSwitchingState(false);
        }
    }, [setIsMiningSwitchingState, isMining]);

    const stopMining = useCallback(async () => {
        setIsMiningSwitchingState(true);
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            console.error('Could not stop mining', e);
        } finally {
            setIsMiningSwitchingState(false);
        }
    }, [setIsMiningSwitchingState]);

    const shouldDisplayLoading =
        isMiningSwitchingState || (!isMining && isMiningEnabled);
    return {
        startMining,
        stopMining,
        shouldDisplayLoading,
        hasMiningBeenStopped: hasMiningStartedAtLeastOnce.current,
    };
}
