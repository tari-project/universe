import { useCallback } from 'react';
import { TrayIcon } from '@tauri-apps/api/tray';
import { Image } from '@tauri-apps/api/image';
import { type } from '@tauri-apps/plugin-os';

import standard from '/assets/icons/systray_icon.ico?url';
import darkMode from '/assets/icons/systray_icon_dark_mode.ico?url';

function useHandleSystemTrayIcon() {
    return useCallback(async (systemDarkMode: boolean) => {
        if (type() === 'macos') return;

        const logoUrl = systemDarkMode ? darkMode : standard;
        const logo = new Uint8Array(await (await fetch(logoUrl)).arrayBuffer());
        const tray = await TrayIcon.getById('universe-tray-id');
        const img = await Image.fromBytes(logo);
        tray?.setIcon(img);
    }, []);
}

export { useHandleSystemTrayIcon };
