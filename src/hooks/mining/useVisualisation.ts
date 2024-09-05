import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { appWindow } from '@tauri-apps/api/window';

export function useVisualisation() {
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);

    const handleMiningStates = useCallback(
        async (state: GlAppState) => {
            const documentIsVisible = document.visibilityState === 'visible';
            const focused = await appWindow.isFocused();
            const minimized = await appWindow.isMinimized();

            const canAnimate = !minimized && (focused || documentIsVisible);

            if (canAnimate) {
                setAnimationState(state);
                if (state === 'fail') {
                    setPostBlockAnimation(true);
                    setTimerPaused(false);
                }
            }
        },
        [setPostBlockAnimation, setTimerPaused]
    );

    return useCallback(
        async (state: GlAppState) => {
            if (state == 'fail' || state == 'success') {
                return handleMiningStates(state);
            } else {
                setAnimationState(state);
            }
        },
        [handleMiningStates]
    );
}
