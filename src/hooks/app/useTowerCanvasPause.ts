import { useEffect } from 'react';
import { TOWER_CANVAS_ID } from '@app/store/types/ui.ts';
import { useUIStore } from '@app/store/useUIStore.ts';

function restoreTowerCanvasId() {
    const canvas =
        document.getElementById(TOWER_CANVAS_ID) ||
        document.querySelector('canvas:not([id])') ||
        document.querySelector('canvas');
    if (canvas) {
        canvas.id = TOWER_CANVAS_ID;
    }
}

/**
 * Pauses the Three.js render loop in @tari-project/tari-tower
 * by removing the canvas DOM id attribute.
 * This triggers the internal guard `if (!document.getElementById(f?.domElement?.id)) return;`
 * (since document.getElementById('') returns null), preventing WebGL draw calls on the GPU when hidden/paused.
 */
export function useTowerCanvasPause(shouldPause: boolean) {
    const towerInitalized = useUIStore((s) => s.towerInitalized);

    useEffect(() => {
        if (shouldPause) {
            const canvas = document.getElementById(TOWER_CANVAS_ID);
            if (canvas) {
                canvas.removeAttribute('id');
            }
        } else {
            restoreTowerCanvasId();
        }

        return () => {
            restoreTowerCanvasId();
        };
    }, [shouldPause, towerInitalized]);
}
