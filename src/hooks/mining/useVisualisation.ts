import { useCallback, useEffect, useState } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const [failure, setFailure] = useState(false);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);

    useEffect(() => {
        if (failure) {
            const failTimeout = setTimeout(() => {
                setPostBlockAnimation(true);
                setTimerPaused(false);
                setFailure(false);
            }, 1500);
            return () => clearTimeout(failTimeout);
        }
    }, [failure, setPostBlockAnimation, setTimerPaused]);

    return useCallback((state: GlAppState) => {
        setAnimationState(state);
        if (state === 'fail') {
            setFailure(true);
        }
    }, []);
}
