import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore, useMiningStore } from '@app/store';
import { handleSessionMiningTimeOnClose } from '@app/store/actions/miningStoreActions.ts';
const appWindow = getCurrentWindow();

function useShutdownHandler(shutdownTriggered = false) {
    const wasFeedbackSent = useConfigUIStore((s) => s.feedback?.early_close.feedback_sent);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const miningTimeMs = useMiningStore((s) => s.sessionMiningTime.durationMs);
    const isEarlyClose = !miningTimeMs || miningTimeMs < 60 * 60 * 1000;

    const [shouldShutDown, setShouldShutDown] = useState(false);
    useEffect(
        () => setShouldShutDown(wasFeedbackSent || !isEarlyClose || (isEarlyClose && earlyClosedDismissed)),
        [earlyClosedDismissed, isEarlyClose, wasFeedbackSent]
    );

    return shutdownTriggered ? shouldShutDown : false;
}

export function useShuttingDown() {
    const [shutdownTriggered, setShutdownTriggered] = useState(false);
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    const shouldShutDown = useShutdownHandler(shutdownTriggered);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                handleSessionMiningTimeOnClose();
                setShutdownTriggered(true);
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
    }, [isShuttingDown, shouldShutDown]);

    useEffect(() => {
        if (isShuttingDown || shouldShutDown) {
            const shutDownTimout = setTimeout(async () => {
                await invoke('exit_application');
            }, 250);
            return () => clearTimeout(shutDownTimout);
        }
    }, [isShuttingDown, shouldShutDown]);

    return isShuttingDown;
}
