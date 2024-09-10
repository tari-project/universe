import { useCallback, useEffect, useState } from 'react';
import { setAnimationState } from '../../visuals';
import { appWindow } from '@tauri-apps/api/window';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { resourceDir, join } from '@tauri-apps/api/path';
import { readBinaryFile } from '@tauri-apps/api/fs';

async function playBlockWinAudio() {
    const resourceDirPath = await resourceDir();
    const filePath = await join(resourceDirPath, 'audio/block_win.mp3');
    readBinaryFile(filePath)
        .catch((err) => {
            console.error(err);
        })
        .then((res) => {
            const fileBlob = new Blob([res as ArrayBuffer], { type: 'audio/mpeg' });
            const reader = new FileReader();
            reader.readAsDataURL(fileBlob);
            const url = URL.createObjectURL(fileBlob);
            const audio = new Audio(url);
            audio.play();
        });
}

export function useVisualisation() {
    const [useFailTimeout, setUseFailTimeout] = useState(false);
    const { setTimerPaused, setPostBlockAnimation, setEarnings, audioEnabled } = useMiningStore(
        useShallow((s) => ({
            setPostBlockAnimation: s.setPostBlockAnimation,
            setTimerPaused: s.setTimerPaused,
            setEarnings: s.setEarnings,
            audioEnabled: s.audioEnabled,
        }))
    );

    const checkCanAnimate = useCallback(async () => {
        const focused = await appWindow?.isFocused();
        const minimized = await appWindow?.isMinimized();
        const documentIsVisible = document?.visibilityState === 'visible' || false;

        return !minimized && (focused || documentIsVisible);
    }, []);

    useEffect(() => {
        if (useFailTimeout) {
            const failAnimationTimeout = setTimeout(() => {
                setPostBlockAnimation(true);
                setTimerPaused(false);
                setUseFailTimeout(false);
            }, 1500);

            return () => {
                clearTimeout(failAnimationTimeout);
            };
        }
    }, [setPostBlockAnimation, setTimerPaused, useFailTimeout]);

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
            if (audioEnabled) {
                playBlockWinAudio();
            }
        }
    }, [checkCanAnimate, setEarnings, audioEnabled]);

    return { handleFail, handleWin };
}
