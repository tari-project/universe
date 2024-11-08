import { Menu } from '@tauri-apps/api/menu';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';
import { TrayIcon } from '@tauri-apps/api/tray';
import { useCallback, useEffect, useRef } from 'react';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const appWindow = getCurrentWebviewWindow();
const tray = await TrayIcon.getById('universe-systray');

//             {
//                     id: 'unminimize',
//                     text: 'Unminimize',
//                     enabled: await appWindow?.isMinimized(),
//                     action: () => {
//                         appWindow.unminimize();
//                     },
//                 },
//                 {
//                     id: 'minimize',
//                     text: 'Minimize',
//                     enabled: await appWindow?.isMinimizable(),
//                     action: () => {
//                         appWindow.minimize();
//                     },
//                 },

export function useInitSystemTray() {
    const initiated = useRef(false);
    const setMenu = useCallback(async () => {
        const separator = {
            item: 'Separator',
        } as PredefinedMenuItemOptions;

        return await Menu.new({
            items: [
                {
                    id: 'cpu_hashrate',
                    text: 'CPU Hashrate:',
                    enabled: false,
                },
                {
                    id: 'gpu_hashrate',
                    text: 'GPU Hashrate:',
                    enabled: false,
                },
                separator,
                {
                    id: 'cpu_usage',
                    text: 'CPU Usage:',
                    enabled: false,
                },
                {
                    id: 'gpu_usage',
                    text: 'GPU Usage:',
                    enabled: false,
                },
                separator,
                {
                    id: 'estimated_earning',
                    text: 'Est earning: {} tXTM/day',
                    enabled: false,
                },
            ],
        });
    }, []);
    const setInitialTray = useCallback(async () => {
        const menu = await setMenu();
        if (tray) {
            await tray.setIcon('icons/icon.png');
            await tray.setMenu(menu);
        }
    }, [setMenu]);

    useEffect(() => {
        if (initiated.current) return;
        setInitialTray().then(() => {
            initiated.current = true;
        });
    }, [setInitialTray]);
}
