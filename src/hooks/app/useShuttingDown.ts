import { useEffect, useState } from 'react';
import { resetAllStores } from '@app/store/create.ts';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                setIsShuttingDown(true);
                event.preventDefault();
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [isShuttingDown]);

    useEffect(() => {
        if (isShuttingDown) {
            setTimeout(async () => {
                resetAllStores();
                await invoke('exit_application');
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
