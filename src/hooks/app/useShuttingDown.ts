import { useEffect } from 'react';
import { useShutdownHandler } from '@app/hooks/app/useShutdownHandler.ts';
import { useAppStateStore, useUIStore } from '@app/store';

export function useShuttingDown() {
    const isSystrayAppShutdownRequested = useAppStateStore((s) => s.isSystrayAppShutdownRequested);
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);
    const { onShutdownCaught, shutdownInitiated } = useShutdownHandler();

    useEffect(() => {
        if (!isShuttingDown && !shutdownInitiated && isSystrayAppShutdownRequested) {
            onShutdownCaught();
        }
    }, [isShuttingDown, onShutdownCaught, shutdownInitiated, isSystrayAppShutdownRequested]);
}
