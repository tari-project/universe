import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useShutdownHandler } from '@app/hooks/app/useShutdownHandler.ts';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const { onShutdownCaught } = useShutdownHandler();

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            event.preventDefault();
            await onShutdownCaught();
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [onShutdownCaught]);
}
