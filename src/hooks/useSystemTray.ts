import { useHardwareStats } from '@app/hooks/useHardwareStats';
import { useMiningStore } from '@app/store/useMiningStore';
import { useFormatBalance } from '@app/utils/formatBalance';
import { Menu } from '@tauri-apps/api/menu';
import { PredefinedMenuItemOptions } from '@tauri-apps/api/menu/predefinedMenuItem';
import { TrayIcon, TrayIconEvent } from '@tauri-apps/api/tray';
import { useCallback, useEffect, useMemo, useRef } from 'react';

const defaultIconPath = 'icons/systray_icon.ico';
const darkIconPath = 'icons/icon.png';

export function useInitSystemTray() {
    const initiated = useRef(false);
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

    const getMenu = useCallback(async () => {
        const separator = {
            item: 'Separator',
        } as PredefinedMenuItemOptions;

        return await Menu.new({
            items: [
                {
                    id: 'cpu_hashrate',
                    text: `CPU Hashrate: ${cpu_h}`,
                    enabled: false,
                },
                {
                    id: 'gpu_hashrate',
                    text: `GPU Hashrate: ${gpu_h}`,
                    enabled: false,
                },
                separator,
                {
                    id: 'cpu_usage',
                    text: `CPU Usage: ${cpuUsage}`,
                    enabled: false,
                },
                {
                    id: 'gpu_usage',
                    text: `GPU Usage: ${gpuUsage}`,
                    enabled: false,
                },
                separator,
                {
                    id: 'estimated_earning',
                    text: `Est earning: ${totalEarningsFormatted} tXTM/day`,
                    enabled: false,
                },
            ],
        });
    }, [cpuUsage, cpu_h, gpuUsage, gpu_h, totalEarningsFormatted]);

    const menuEvents = useMemo(
        () => ({
            action: (event: TrayIconEvent) => {
                switch (event.type) {
                    case 'Click':
                        break;
                    case 'Enter':
                        getMenu().then(async (menu) => {
                            const t = await TrayIcon.getById('universe-tray-icon');
                            if (t) {
                                await t.setMenu(menu);
                            }
                        });

                        break;
                }
            },
        }),
        [getMenu]
    );

    const setInitialTray = useCallback(async () => {
        await TrayIcon.removeById('universe-tray-icon');
        const tray = await TrayIcon.new({
            id: 'universe-tray-icon',
            action: menuEvents.action,
            icon: prefersDarkMode() ? darkIconPath : defaultIconPath,
        });
        const menu = await getMenu();
        if (tray) {
            await tray.setMenu(menu);
        }
    }, [menuEvents.action, getMenu]);

    useEffect(() => {
        setInitialTray().then(() => {
            initiated.current = true;
        });
    }, [setInitialTray]);
}
