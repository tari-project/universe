import { useCallback } from 'react';
import { setStart, setPause, setStop, setComplete, setFail, setRestartAnimation } from '../visuals';

export function useVisualisation() {
    const handleStart = useCallback(() => setStart(), []);
    const handleRestart = useCallback(() => setRestartAnimation(), []);
    const handlePause = useCallback(() => setPause(), []);
    const handleStop = useCallback(() => setStop(), []);
    const handleFail = useCallback(() => setFail(), []);
    const handleComplete = useCallback(() => setComplete(), []);

    return { handleComplete, handleStop, handleStart, handleRestart, handlePause, handleFail };
}
