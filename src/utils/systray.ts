import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { MenuItemOptions } from '@tauri-apps/api/menu/menuItem';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';

const TRAY_ID = 'universe-tray-id';
const TRAY_MENU_ID = 'universe-tray-menu-id';
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
        text: `CPU Hashrate: -`,
        enabled: false,
    },
    {
        id: 'gpu_hashrate',
        text: `GPU Hashrate: -`,
        enabled: false,
    },
    separator,
    {
        id: 'estimated_earning',
        text: `Est earning: -`,
        enabled: false,
    },
] as MenuItemOptions[];

export const menu = await Menu.new({
    id: TRAY_MENU_ID,
    items: [about, separator, ...dynamicItems, minimize],
});

export const tray = await TrayIcon.getById(TRAY_ID);
export async function initSystray() {
    await tray?.setIcon(icon);
    if (menu) {
        await tray?.setMenu(menu);
    }
}
