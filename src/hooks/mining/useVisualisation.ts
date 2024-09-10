import { useCallback, useEffect, useState } from 'react';
import { setAnimationState } from '../../visuals';
import { appWindow } from '@tauri-apps/api/window';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

export function useVisualisation() {
    const [useFailTimeout, setUseFailTimeout] = useState(false);

    const cpuIsMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const gpuIsMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = cpuIsMining || gpuIsMining;

    const { setTimerPaused, setPostBlockAnimation, setEarnings } = useMiningStore(
        useShallow((s) => ({
            setPostBlockAnimation: s.setPostBlockAnimation,
            setTimerPaused: s.setTimerPaused,
            setEarnings: s.setEarnings,
        }))
    );

    const checkCanAnimate = useCallback(async () => {
        if (!isMining) return false;
        const focused = await appWindow?.isFocused();
        const minimized = await appWindow?.isMinimized();
        const documentIsVisible = document?.visibilityState === 'visible' || false;

        return !minimized && (focused || documentIsVisible);
    }, [isMining]);

    useEffect(() => {
        if (useFailTimeout) {
            const failAnimationTimeout = setTimeout(
                () => {
                    setPostBlockAnimation(true);
                    setTimerPaused(false);
                    setUseFailTimeout(false);
                },
                isMining ? 1500 : 1
            );

            return () => {
                clearTimeout(failAnimationTimeout);
            };
        }
    }, [isMining, setPostBlockAnimation, setTimerPaused, useFailTimeout]);

    const handleFail = useCallback(async () => {
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            setAnimationState('fail');
            setUseFailTimeout(true);
        }
    }, [checkCanAnimate]);

    const handleWin = useCallback(async () => {
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            setAnimationState('success');
        } else {
            setEarnings(undefined);
        }
    }, [checkCanAnimate, setEarnings]);

    return { handleFail, handleWin };
}
