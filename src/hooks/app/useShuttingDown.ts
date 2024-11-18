import { useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { resetAllStores } from '@app/store/create.ts';
const appWindow = getCurrentWebviewWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown && !event.isPreventDefault()) {
                setIsShuttingDown(true);
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
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
