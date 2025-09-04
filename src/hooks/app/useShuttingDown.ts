import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const [isShuttingDown, setIsShuttingDown] = useState(false);
    const isEarlyClose = true; //temp

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                if (isEarlyClose && !earlyClosedDismissed) {
                    setShowCloseDialog(true);
                } else {
                    setIsShuttingDown(true);
                }
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [earlyClosedDismissed, isEarlyClose, isShuttingDown]);

    useEffect(() => {
        if (isShuttingDown) {
            const shutDownTimout = setTimeout(async () => {
                await invoke('exit_application');
            }, 250);
            return () => clearTimeout(shutDownTimout);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
