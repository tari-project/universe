import { useCallback, useEffect, useState } from 'react';
import { setAnimationState } from '../../visuals';
import { appWindow } from '@tauri-apps/api/window';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useVisualisation() {
    const [useFailTimeout, setUseFailTimeout] = useState(false);
    const setMiningControlsEnabled = useMiningStore((s) => s.setMiningControlsEnabled);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const cpuIsMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const gpuIsMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isMining = cpuIsMining || gpuIsMining;

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
            setMiningControlsEnabled(false);
            setAnimationState('fail');
            setUseFailTimeout(true);
        }
    }, [checkCanAnimate, setMiningControlsEnabled]);

    const handleWin = useCallback(async () => {
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            setMiningControlsEnabled(false);
            setAnimationState('success');
        } else {
            setEarnings(undefined);
        }
    }, [checkCanAnimate, setEarnings, setMiningControlsEnabled]);

    return { handleFail, handleWin };
}
