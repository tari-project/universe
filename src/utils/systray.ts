import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { MenuItemOptions } from '@tauri-apps/api/menu/menuItem';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';

const TRAY_ID = 'universe-tray-id';
const TRAY_MENU_ID = 'universe-tray-menu-id';
const defaultIconPath = 'icons/systray_icon.ico';
const darkIconPath = 'icons/icon.png';

export const CPU_HASH_ITEM_ID = 'cpu_hashrate';
export const GPU_HASH_ITEM_ID = 'gpu_hashrate';
export const EARNINGS_ITEM_ID = 'estimated_earning';

const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const icon = prefersDarkMode() ? darkIconPath : defaultIconPath;

const about = {
    item: { About: null },
} as PredefinedMenuItemOptions;
const separator = {
    item: 'Separator',
} as PredefinedMenuItemOptions;

const minimize = {
    item: 'Minimize',
    text: 'Minimize',
} as PredefinedMenuItemOptions;

// TODO use translations
const dynamicItems = [
    {
        id: CPU_HASH_ITEM_ID,
        text: `CPU Hashrate: -`,
        enabled: false,
    },
    {
        id: GPU_HASH_ITEM_ID,
        text: `GPU Hashrate: -`,
        enabled: false,
    },
    separator,
    {
        id: EARNINGS_ITEM_ID,
        text: `Est earning: -`,
        enabled: false,
    },
] as MenuItemOptions[];

let tray: TrayIcon | null;
let menu: Menu;
export async function initSystray() {
    menu = await Menu.new({
        id: TRAY_MENU_ID,
        items: [about, separator, ...dynamicItems, separator, minimize],
    });

    tray = await TrayIcon.getById(TRAY_ID);

    await tray?.setIcon(icon);
    if (menu) {
        await tray?.setMenu(menu);
    }
}

export { tray, menu };
