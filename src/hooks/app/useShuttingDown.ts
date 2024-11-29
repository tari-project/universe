import { tray } from '@app/utils';
import { useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { resetAllStores } from '@app/store/create.ts';
const appWindow = getCurrentWebviewWindow();

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
            setTimeout(() => {
                tray?.close();
                resetAllStores();
                appWindow.close();
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
