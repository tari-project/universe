import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { MenuItemOptions } from '@tauri-apps/api/menu/menuItem';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';

const TRAY_ID = 'universe-tray-id';
const TRAY_MENU_ID = 'universe-tray-menu-id';

export const CPU_HASH_ITEM_ID = 'cpu_hashrate';
export const GPU_HASH_ITEM_ID = 'gpu_hashrate';
export const EARNINGS_ITEM_ID = 'estimated_earning';

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
    try {
        menu = await Menu.new({
            id: TRAY_MENU_ID,
            items: [about, separator, ...dynamicItems, separator, minimize],
        });
    } catch (e) {
        console.error('Menu error: ', e);
    }

    try {
        tray = await TrayIcon.getById(TRAY_ID);
    } catch (e) {
        console.error('TrayIcon error: ', e);
    }

    try {
        if (tray && menu) {
            await tray?.setMenu(menu);
        }
    } catch (e) {
        console.error('Set TrayIcon Menu error: ', e);
    }
}

export { tray, menu };
