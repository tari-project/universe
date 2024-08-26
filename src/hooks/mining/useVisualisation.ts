import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const toggleTimerPaused = useMiningStore((s) => s.toggleTimerPaused);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    return useCallback(
        (state: GlAppState) => {
            setAnimationState(state);

            if (state === 'fail') {
                setPostBlockAnimation(true);
            }
            toggleTimerPaused({ pause: false });
        },
        [setPostBlockAnimation, toggleTimerPaused]
    );
}
