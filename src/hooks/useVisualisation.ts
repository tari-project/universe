import { setStart, setStop, setRestart, setFailure } from '../visuals';
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

    const handleFail = useCallback(async () => {
        return await setFailure();
    }, []);

    return { handleStart, handlePause, handleFail };
}
