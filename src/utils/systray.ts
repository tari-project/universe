import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';

import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';
import { getCurrentWindow } from '@tauri-apps/api/window';

const TRAY_ID = 'universe-tray-id';
const TRAY_MENU_ID = 'universe-tray-menu-id';

export const CPU_HASH_ITEM_ID = 'cpu_hashrate';
export const GPU_HASH_ITEM_ID = 'gpu_hashrate';
export const EARNINGS_ITEM_ID = 'estimated_earning';
export const UNMINIMIZE_ITEM_ID = 'unminimize';
export const MINIMIZE_ITEM_ID = 'minimize';

const about = {
    item: { About: null },
} as PredefinedMenuItemOptions;
const separator = {
    item: 'Separator',
} as PredefinedMenuItemOptions;

const currentWindow = getCurrentWindow();

let tray: TrayIcon | null;
let menu: Menu;

export async function initSystray() {
    const newMenu = await Menu.new({
        id: TRAY_MENU_ID,
        items: [
            about,
            separator,
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
            separator,
            {
                id: UNMINIMIZE_ITEM_ID,
                text: 'Unminimize',
                enabled: false,
                action: () => {
                    currentWindow.unminimize();
                },
            },
            {
                id: MINIMIZE_ITEM_ID,
                text: 'Minimize',
                enabled: true,
                action: () => {
                    currentWindow.minimize();
                },
            },
        ],
    });
    const configTray = await TrayIcon.getById(TRAY_ID);

    if (configTray && newMenu) {
        configTray
            ?.setMenu(newMenu)
            .then(() => {
                menu = newMenu;
                tray = configTray;
            })
            .catch((e) => {
                console.error('TrayIcon error:', e);
                configTray.close();
            });
    }
}

export { tray, menu };
