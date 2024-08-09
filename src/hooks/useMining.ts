import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useUIStore } from '../store/useUIStore';
import { setStart, setPause } from '../visuals';

export function useMining() {
    const isLoading = useUIStore((s) => s.isMiningLoading);
    const setIsLoading = useUIStore((s) => s.setIsMiningLoading);
    const setBackground = useUIStore((s) => s.setBackground);

    const startMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('start_mining', {});
            setStart();
        } catch (e) {
            console.error('Could not start mining', e);
        } finally {
            setIsLoading(false);
            setBackground('mining');
        }
    }, []);
    const stopMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('stop_mining', {});
            setPause();
        } catch (e) {
            console.error('Could not stop mining', e);
        } finally {
            setIsLoading(false);
            setBackground('idle');
        }
    }, []);

    return {
        startMining,
        stopMining,
        isLoading,
    };
}
