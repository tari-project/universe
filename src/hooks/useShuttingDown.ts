import { useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { resetAllStores } from '@app/store/create.ts';
const appWindow = getCurrentWebviewWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        appWindow.onCloseRequested(async (e) => {
            if (!isShuttingDown) {
                e.preventDefault();
                setIsShuttingDown(true);
            }
        });
    }, [isShuttingDown]);

    useEffect(() => {
        if (isShuttingDown) {
            setTimeout(() => {
                resetAllStores();
                appWindow.close();
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
