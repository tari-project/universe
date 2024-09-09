import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { appWindow } from '@tauri-apps/api/window';
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
                playBlockWinAudio();
                if (state === 'fail') {
                    setPostBlockAnimation(true);
                    setTimerPaused(false);
                }
                if (state === 'success') {
                    // playBlockWinAudio();
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
