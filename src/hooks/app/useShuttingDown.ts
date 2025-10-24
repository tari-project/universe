import { useCallback, useEffect } from 'react';
import { useShutdownHandler } from '@app/hooks/app/useShutdownHandler.ts';
import { useAppStateStore, useConfigCoreStore, useConfigUIStore, useUIStore } from '@app/store';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseInfoModal } from '@app/store/actions/uiStoreActions';

export function useShuttingDown() {
    const isSystrayAppShutdownRequested = useAppStateStore((s) => s.isSystrayAppShutdownRequested);
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);
    const { onShutdownCaught, shutdownInitiated } = useShutdownHandler();
    const wasCloseDialogShown = useUIStore((s) => s.isCloseInfoModalShown);
    const wasCloseExperienceSelected = useConfigUIStore((s) => s.close_experience_selected);
    const isTaskTrayMode = useConfigCoreStore((s) => s.tasktray_mode);

    const handleClose = useCallback(() => {
        if (!wasCloseDialogShown && !wasCloseExperienceSelected) {
            setShowCloseInfoModal(true);
        } else if ((wasCloseDialogShown || wasCloseExperienceSelected) && !isTaskTrayMode) {
            onShutdownCaught();
        }
    }, [wasCloseDialogShown, wasCloseExperienceSelected, isTaskTrayMode, onShutdownCaught]);

    useEffect(() => {
        const appWindow = getCurrentWindow();
        const listener = appWindow.onCloseRequested((event) => {
            event.preventDefault(); // Prevent the default close behavior ( Quitting the app )
            handleClose();
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [handleClose]);

    useEffect(() => {
        if (
            !isShuttingDown &&
            !shutdownInitiated &&
            isSystrayAppShutdownRequested &&
            isTaskTrayMode &&
            (wasCloseDialogShown || wasCloseExperienceSelected)
        ) {
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
