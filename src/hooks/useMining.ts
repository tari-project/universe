import { useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { setStart, setStop, setRestart } from '../visuals';

export function useMining() {
    const setIsLoading = useUIStore((s) => s.setIsMiningLoading);
    const setBackground = useUIStore((s) => s.setBackground);
    const hasStarted = useRef(false);

    const startMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('start_mining', {});
        } catch (e) {
            console.error('Could not start mining', e);
        } finally {
            setIsLoading(false);
            setBackground('mining');
            if (!hasStarted.current) {
                hasStarted.current = true;
                setStart();
            } else {
                setRestart();
            }
        }
    }, [setIsLoading, setIsLoading]);

    const stopMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('stop_mining', {});
            setStop();
        } catch (e) {
            console.error('Could not stop mining', e);
        } finally {
            setIsLoading(false);
            setBackground('idle');
        }
    }, [setIsLoading, setIsLoading]);

    return {
        startMining,
        stopMining,
    };
}
