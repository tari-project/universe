import { useEffect, useState } from 'react';
import { resetAllStores } from '@app/store/create.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
const appWindow = getCurrentWindow();

export function useShuttingDown() {
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        const onWindowCloseListener = appWindow.onCloseRequested(async (event) => {
            if (!isShuttingDown) {
                event.preventDefault();
                invoke('exit_application');
            }
        });
        const isShuttingDownListener = listen('is_shutting_down', ({ payload }: { payload: boolean }) => {
            setIsShuttingDown(payload);
        });
        return () => {
            onWindowCloseListener.then((unlisten) => unlisten());
            isShuttingDownListener.then((unlisten) => unlisten());
        };
    }, [isShuttingDown]);

    useEffect(() => {
        if (isShuttingDown) {
            invoke('exit_application');
        }
    }, [isShuttingDown]);

    return isShuttingDown;
}
