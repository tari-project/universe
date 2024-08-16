import { useCallback } from 'react';
import { setStart, setPause, setStop, setComplete, setFail, reset } from '../visuals';

export function useVisualisation() {
    const handleStart = useCallback(() => setStart(), []);
    const handlePause = useCallback(() => setPause(), []);
    const handleStop = useCallback(() => setStop(), []);
    const handleFail = useCallback(
        () =>
            setFail().then((complete) => {
                if (complete) {
                    console.log(`hello?`);
                    reset();
                    console.log(`hi?`);

                    handleStart();
                }
            }),
        [handleStart]
    );
    const handleComplete = useCallback(() => setComplete(), []);

    return { handleComplete, handleStop, handleStart, handlePause, handleFail };
}
