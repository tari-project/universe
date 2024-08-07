import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { setStart, setPause } from '../visuals';
export function useMining() {
    const [isLoading, setIsLoading] = useState(false);
    const startMining = useCallback(async () => {
        setIsLoading(true);
        try {
            await invoke('start_mining', {});
            setStart();
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
            setPause();
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
