import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore, useMiningStore } from '@app/store';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
const appWindow = getCurrentWindow();

function useShutdownHandler(shutdownTriggered = false) {
    const wasFeedbackSent = useConfigUIStore((s) => s.feedback?.early_close?.feedback_sent);
    const long_time_miner = useConfigUIStore((s) => s.feedback?.long_time_miner);
    const wasLongTimeMiner = Boolean(long_time_miner?.feedback_sent || long_time_miner?.last_dismissed !== null);
    const closeMiningTimeMs = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const storedMiningTimeMs = useMiningStore((s) => s.sessionMiningTime.durationMs);
    const [shouldShutDown, setShouldShutDown] = useState(false);

    useEffect(() => {
        const currentMiningTimeMs = checkMiningTime();
        const miningTimeMs = storedMiningTimeMs || currentMiningTimeMs;
        const isEarlyClose = !miningTimeMs || miningTimeMs < closeMiningTimeMs;
        setShouldShutDown(
            wasLongTimeMiner || wasFeedbackSent || !isEarlyClose || (isEarlyClose && earlyClosedDismissed)
        );
    }, [closeMiningTimeMs, earlyClosedDismissed, storedMiningTimeMs, wasFeedbackSent, wasLongTimeMiner]);

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
                checkMiningTime();
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
