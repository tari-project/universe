import { useEffect, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { resetAllStores } from '@app/store/create.ts';

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        appWindow.onCloseRequested(async (e) => {
            if (!isShuttingDown) {
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
