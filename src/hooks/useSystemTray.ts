import { useHardwareStats } from '@app/hooks/useHardwareStats';
import { useMiningStore } from '@app/store/useMiningStore';
import { useFormatBalance } from '@app/utils/formatBalance';
import { formatHashrate } from '@app/utils/formatHashrate';
import { Menu } from '@tauri-apps/api/menu';
import { MenuOptions } from '@tauri-apps/api/menu/menu';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';
import { TrayIcon } from '@tauri-apps/api/tray';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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

const tray = await TrayIcon.getById(TRAY_ID);
const menu = await Menu.new({
    id: 'systray-menu',
});

export function useSystemTray() {
    const hasUpdates = useRef(false);
    const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const { cpu: cpuHardware, gpu: gpuHardware } = useHardwareStats();
    const { cpu_est, cpu_h } = useMiningStore((s) => ({
        cpu_est: s.cpu.mining.estimated_earnings,
        cpu_h: s.cpu.mining.hash_rate,
    }));
    const { gpu_est, gpu_h } = useMiningStore((s) => ({
        gpu_est: s.gpu.mining.estimated_earnings,
        gpu_h: s.gpu.mining.hash_rate,
    }));
    const totalEarningsFormatted = useFormatBalance(cpu_est + gpu_est);
    const gpuUsage = gpuHardware
        ? gpuHardware?.reduce((acc, current) => acc + current.usage_percentage, 0) / (gpuHardware?.length || 1)
        : 0;

    const cpuUsage = cpuHardware
        ? cpuHardware?.reduce((acc, current) => acc + current.usage_percentage, 0) / (cpuHardware?.length || 1)
        : 0;

    const menuItems = useMemo(() => {
        // TODO use listener
        hasUpdates.current = Boolean(totalEarningsFormatted || gpuUsage || cpuUsage || cpu_h || gpu_h);
        return [
            about,
            separator,
            {
                id: 'cpu_hashrate',
                text: `CPU Hashrate: ${cpu_h ? `${formatHashrate(cpu_h)}` : '-'}`,
                enabled: false,
            },
            {
                id: 'gpu_hashrate',
                text: `GPU Hashrate: ${gpu_h ? `${formatHashrate(gpu_h)}` : '-'}`,
                enabled: false,
            },
            separator,
            {
                id: 'cpu_usage',
                text: `CPU Usage: ${cpuUsage || '-'}`,
                enabled: false,
            },
            {
                id: 'gpu_usage',
                text: `GPU Usage: ${gpuUsage || '-'}`,
                enabled: false,
            },
            separator,
            {
                id: 'estimated_earning',
                text: `Est earning: ${totalEarningsFormatted !== '0' ? totalEarningsFormatted : '-'} tXTM/day`,
                enabled: false,
            },
            minimize,
        ] as MenuOptions['items'];
    }, [cpuUsage, cpu_h, gpuUsage, gpu_h, totalEarningsFormatted]);

    const setTray = useCallback(async () => {
        const icon = prefersDarkMode() ? darkIconPath : defaultIconPath;
        if (menu) {
            const items = await menu.items();
            if (!items.length && menuItems) {
                await menu.append(menuItems);
            }
            await tray?.setMenu(menu);
        }
        await tray?.setIcon(icon);
    }, [menuItems]);

    useEffect(() => {
        void setTray();
    }, [setTray]);
}
