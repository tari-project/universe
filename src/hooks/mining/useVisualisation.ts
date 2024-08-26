import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    return useCallback(
        (state: GlAppState) => {
            setAnimationState(state);

            if (state === 'fail') {
                setPostBlockAnimation(true);
            }
        },
        [setPostBlockAnimation]
    );
}
