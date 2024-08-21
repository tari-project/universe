import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const toggleTimerPaused = useMiningStore((s) => s.toggleTimerPaused);
    return useCallback(
        (state: GlAppState) => {
            if (state == 'success' || state == 'fail') {
                toggleTimerPaused(true);
            }
            setAnimationState(state);
            toggleTimerPaused(false);
        },
        [toggleTimerPaused]
    );
}
