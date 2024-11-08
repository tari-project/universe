import { useCallback, useEffect } from 'react';
import { TrayIcon } from '@tauri-apps/api/tray';
import { Menu, PredefinedMenuItem } from '@tauri-apps/api/menu';

export function useSystemTray() {
    const setMenu = useCallback(async () => {
        const separator = await PredefinedMenuItem.new({ item: 'Separator' });
        const menu = await Menu.new({
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
                {
                    id: 'unminimize',
                    text: 'Unminimize',
                },
            ],
        });

        return menu;
    }, []);
    const setTray = useCallback(async () => {
        const tray = await TrayIcon.getById('universe-systray');
        const menu = await setMenu();
        if (tray) {
            tray.setTitle('fancy systray ');
            tray.setIcon('icons/icon.png');
            tray.setMenu(menu);
        }
    }, []);

    useEffect(() => {
        setTray();
    }, []);
}
