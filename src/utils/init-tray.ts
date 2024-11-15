import { Menu } from '@tauri-apps/api/menu';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';
import { TrayIcon } from '@tauri-apps/api/tray';

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
});
const tray = await TrayIcon.getById(TRAY_ID);
