import { useEffect, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';

export function useShuttingDown() {
    const [isShutingDown, setIsShutingDown] = useState(false);

    useEffect(() => {
        appWindow.onCloseRequested(async (e) => {
            if (!isShutingDown) {
                e.preventDefault();
                setIsShutingDown(true);
            }
        });
    }, []);

    useEffect(() => {
        if (isShutingDown) {
            setTimeout(() => {
                appWindow.close();
            }, 250);
        }
    }, [isShutingDown]);

    return isShutingDown;
}
