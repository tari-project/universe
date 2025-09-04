import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        async function checkMiningTime() {
            return invoke('get_session_mining_time')
                .then((miningTimeInSeconds) => {
                    const hourInSeconds = 60 * 60;
                    return miningTimeInSeconds < hourInSeconds;
                })
                .catch((_) => true);
        }

        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                if (earlyClosedDismissed) {
                    setIsShuttingDown(true);
                }
                const isEarlyClose = await checkMiningTime();
                if (isEarlyClose) {
                    setShowCloseDialog(true);
                }
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [earlyClosedDismissed, isShuttingDown]);

    useEffect(() => {
        if (isShuttingDown || earlyClosedDismissed) {
            const shutDownTimout = setTimeout(async () => {
                await invoke('exit_application');
            }, 250);
            return () => clearTimeout(shutDownTimout);
        }
    }, [earlyClosedDismissed, isShuttingDown]);

    return isShuttingDown;
}
