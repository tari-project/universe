import { useEffect, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';

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
                appWindow.close();
            }, 250);
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
