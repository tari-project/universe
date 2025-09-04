import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const wasFeedbackSent = useConfigUIStore((s) => s.feedback?.early_close.feedback_sent);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        if (earlyClosedDismissed) {
            setIsShuttingDown(true);
        }
    }, [earlyClosedDismissed]);

    const checkMiningTime = useCallback(
        async () =>
            invoke('get_session_mining_time')
                .then((miningTimeInSeconds) => {
                    const hourInSeconds = 60 * 60;
                    return miningTimeInSeconds < hourInSeconds;
                })
                .catch((_) => true),
        []
    );

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                if (!wasFeedbackSent && !earlyClosedDismissed) {
                    const isEarlyClose = await checkMiningTime();
                    if (isEarlyClose) {
                        setShowCloseDialog(true);
                        return;
                    }
                }
                setIsShuttingDown(true);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [checkMiningTime, earlyClosedDismissed, isShuttingDown, wasFeedbackSent]);

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
