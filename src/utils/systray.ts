import { formatHashrate } from '@app/utils/formatHashrate';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';

const TRAY_ID = 'universe-tray-icon';
const defaultIconPath = 'icons/systray_icon.ico';
const darkIconPath = 'icons/icon.png';

const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const icon = prefersDarkMode() ? darkIconPath : defaultIconPath;

export const about = {
    item: { About: null },
} as PredefinedMenuItemOptions;
export const separator = {
    item: 'Separator',
} as PredefinedMenuItemOptions;

export const minimize = {
    item: 'Minimize',
    text: 'Minimize',
} as PredefinedMenuItemOptions;

const dynamicItems = [
    {
        id: 'cpu_hashrate',
        text: `-`,
        enabled: false,
    },
    {
        id: 'gpu_hashrate',
        text: `-`,
        enabled: false,
    },
    separator,
    {
        id: 'estimated_earning',
        text: `Est earning: -`,
        enabled: false,
    },
];

export const menu = await Menu.new({
    id: 'systray-menu',
    items: [about, separator, dynamicItems, minimize],
});

export const tray = await TrayIcon.getById(TRAY_ID);

export async function initSystray() {
    await tray?.setIcon(icon);

    if (menu) {
        await tray?.setMenu(menu);
    }
}
