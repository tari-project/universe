import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';

const TRAY_ID = 'universe-tray-icon';
const defaultIconPath = 'icons/systray_icon.ico';
const darkIconPath = 'icons/icon.png';

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
const menu = await Menu.new({
    id: 'systray-menu',
    items: [about, separator, minimize],
});
const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const icon = prefersDarkMode() ? darkIconPath : defaultIconPath;

const tray = await TrayIcon.getById(TRAY_ID);

export async function initTray() {
    await tray?.setIcon(icon);
    await tray?.setMenu(menu);
}
