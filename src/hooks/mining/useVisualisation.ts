import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    return useCallback(
        (state: GlAppState) => {
            setAnimationState(state);
            if (state === 'fail') {
                setTimerPaused(false);
                setPostBlockAnimation(true);
            }
        },
        [setPostBlockAnimation, setTimerPaused]
    );
}
