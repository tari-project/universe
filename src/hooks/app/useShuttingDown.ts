import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setShowCloseDialog } from '@app/store/stores/userFeedbackStore.ts';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);
    const shutdownAttempts = useRef(0);
    const isEarlyClose = true; //temp

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            console.debug(`shutdownAttempts.current= `, shutdownAttempts.current);
            if (shutdownAttempts.current === 0) {
                event.preventDefault();
                shutdownAttempts.current += 1;
                if (isEarlyClose) {
                    setShowCloseDialog(true);
                    return;
                } else if (!isShuttingDown) {
                    setIsShuttingDown(true);
                }
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [isShuttingDown, isEarlyClose]);

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
