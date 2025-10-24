import { useCallback, useEffect } from 'react';
import { useShutdownHandler } from '@app/hooks/app/useShutdownHandler.ts';
import { useAppStateStore, useConfigUIStore, useUIStore } from '@app/store';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseInfoModal } from '@app/store/actions/uiStoreActions';

export function useShuttingDown() {
    const isSystrayAppShutdownRequested = useAppStateStore((s) => s.isSystrayAppShutdownRequested);
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);
    const { onShutdownCaught, shutdownInitiated } = useShutdownHandler();
    const wasCloseDialogShown = useUIStore((s) => s.isCloseInfoModalShown);
    const wasCloseExperienceSelected = useConfigUIStore((s) => s.close_experience_selected);

    console.log('WasCloseDialogShown:', wasCloseDialogShown);
    console.log('WasCloseExperienceSelected:', wasCloseExperienceSelected);

    const handleCloseDialog = useCallback(() => {
        if (!wasCloseDialogShown && !wasCloseExperienceSelected) {
            console.info('[useShuttingDown] Showing close experience dialog');
            setShowCloseInfoModal(true);
        }
    }, [wasCloseDialogShown, wasCloseExperienceSelected]);

    useEffect(() => {
        const appWindow = getCurrentWindow();
        const listener = appWindow.onCloseRequested((event) => {
            console.info('[useShuttingDown] onCloseRequested event caught');
            event.preventDefault(); // Prevent the default close behavior ( Quitting the app )
            handleCloseDialog();
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [handleCloseDialog]);

    useEffect(() => {
        console.log('[useShuttingDown]', {
            isShuttingDown,
            shutdownInitiated,
            isSystrayAppShutdownRequested,
            wasCloseDialogShown,
            wasCloseExperienceSelected,
        });
        if (
            !isShuttingDown &&
            !shutdownInitiated &&
            isSystrayAppShutdownRequested &&
            (wasCloseDialogShown || wasCloseExperienceSelected)
        ) {
            console.log('[useShuttingDown] Systray app shutdown requested, proceeding with shutdown');
            console.log({
                isShuttingDown,
                shutdownInitiated,
                isSystrayAppShutdownRequested,
                wasCloseDialogShown,
                wasCloseExperienceSelected,
            });
            onShutdownCaught();
        }
    }, [
        isShuttingDown,
        onShutdownCaught,
        shutdownInitiated,
        isSystrayAppShutdownRequested,
        wasCloseDialogShown,
        wasCloseExperienceSelected,
    ]);
}
