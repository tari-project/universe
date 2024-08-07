import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useMining() {
    const [isLoading, setIsLoading] = useState(false);
    const startMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('start_mining', {});
        } catch (e) {
            console.error('Could not start mining', e);
        } finally {
            setIsLoading(false);
        }
    }, []);
    const stopMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            console.error('Could not stop mining', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        startMining,
        stopMining,
        isLoading,
    };
}
