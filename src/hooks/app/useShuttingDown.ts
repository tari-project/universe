import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useShutdownHandler } from '@app/hooks/app/useShutdownHandler.ts';
import { useUIStore } from '@app/store';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);
    const { onShutdownCaught, shutdownInitiated } = useShutdownHandler();

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown && !shutdownInitiated) {
                event.preventDefault();
                await onShutdownCaught();
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [isShuttingDown, onShutdownCaught, shutdownInitiated]);
}
