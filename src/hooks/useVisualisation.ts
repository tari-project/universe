import { setStart, setStop, setRestart } from '../visuals';
import { useCallback } from 'react';

export function useVisualisation() {
    const handleStart = useCallback(async (hasMiningBeenStopped = false) => {
        if (!hasMiningBeenStopped) {
            return await setStart();
        } else {
            return await setRestart();
        }
    }, []);

    const handlePause = useCallback(async () => {
        return await setStop();
    }, []);

    return { handleStart, handlePause };
}
