import { useCallback, useEffect } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { appWindow } from '@tauri-apps/api/window';

export function useVisualisation() {
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    const showFailAnimation = useMiningStore((s) => s.showFailAnimation);
    const setShowFailAnimation = useMiningStore((s) => s.setShowFailAnimation);

    useEffect(() => {
        if (showFailAnimation) {
            const failTimeout = setTimeout(() => {
                setTimerPaused(false);
                setShowFailAnimation(false);
                setPostBlockAnimation(true);
            }, 1000);
            return () => clearTimeout(failTimeout);
        }
    }, [showFailAnimation, setPostBlockAnimation, setTimerPaused, setShowFailAnimation]);

    return useCallback(async (state: GlAppState) => {
        const documentIsVisible = document.visibilityState === 'visible';
        const focused = await appWindow.isFocused();
        const minimized = await appWindow.isMinimized();

        const canAnimate = !minimized && (focused || documentIsVisible);
        if (!canAnimate && (state == 'fail' || state == 'success')) {
            return;
        } else {
            setAnimationState(state);
        }
    }, []);
}
