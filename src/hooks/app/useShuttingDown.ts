import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
const appWindow = getCurrentWindow();

function useShutdownHandler() {
    const wasFeedbackSent = useConfigUIStore((s) => s.feedback?.early_close.feedback_sent);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const miningTimeInSec = useUserFeedbackStore((s) => s.miningTimeInSec);
    const isEarlyClose = miningTimeInSec < 60 * 60;

    return useCallback(
        () => wasFeedbackSent || !isEarlyClose || (isEarlyClose && earlyClosedDismissed),
        [earlyClosedDismissed, isEarlyClose, wasFeedbackSent]
    );
}

export function useShuttingDown() {
    const checkShouldShutDown = useShutdownHandler();
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                const shouldShutDown = checkShouldShutDown();
                if (shouldShutDown) {
                    setIsShuttingDown(true);
                } else {
                    setShowCloseDialog(true);
                }
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [checkShouldShutDown, isShuttingDown]);

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
