import { useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { resetAllStores } from '@app/store/create.ts';
const appWindow = getCurrentWebviewWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (e) => {
            if (!isShuttingDown) {
                setIsShuttingDown(true);
                e.preventDefault();
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
                await appWindow.destroy();
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
