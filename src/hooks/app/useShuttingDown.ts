import { useEffect, useState } from 'react';
import { resetAllStores } from '@app/store/create.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const ul = appWindow.onCloseRequested(async () => {
            if (!isShuttingDown) {
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
