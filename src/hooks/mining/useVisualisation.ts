import { useCallback, useEffect } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    const showFailAnimation = useMiningStore((s) => s.showFailAnimation);
    const setShowFailAnimation = useMiningStore((s) => s.setShowFailAnimation);

    useEffect(() => {
        if (showFailAnimation) {
            const failTimeout = setTimeout(() => {
                setPostBlockAnimation(true);
                setTimerPaused(false);
                setShowFailAnimation(false);
            }, 1500);
            return () => clearTimeout(failTimeout);
        }
    }, [showFailAnimation, setPostBlockAnimation, setTimerPaused, setShowFailAnimation]);

    return useCallback(
        (state: GlAppState) => {
            if (state === 'fail' && !showFailAnimation) {
                return;
            }
            setAnimationState(state);
        },
        [showFailAnimation]
    );
}
