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
        const failTimeout = setTimeout(
            () => {
                setPostBlockAnimation(true);
                setTimerPaused(false);
                setShowFailAnimation(false);
            },
            showFailAnimation ? 1500 : 1
        );
        return () => clearTimeout(failTimeout);
    }, [showFailAnimation, setPostBlockAnimation, setTimerPaused, setShowFailAnimation]);

    return useCallback((state: GlAppState) => {
        setAnimationState(state);
    }, []);
}
