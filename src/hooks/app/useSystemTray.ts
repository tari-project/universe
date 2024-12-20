import { MinerMetrics } from '@app/types/app-status';
import {
    menu,
    CPU_HASH_ITEM_ID,
    GPU_HASH_ITEM_ID,
    EARNINGS_ITEM_ID,
    UNMINIMIZE_ITEM_ID,
    MINIMIZE_ITEM_ID,
} from '@app/utils';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useRef } from 'react';

import { formatHashrate, formatNumber, FormatPreset } from '@app/utils';
import { MenuItem } from '@tauri-apps/api/menu/menuItem';

const currentWindow = getCurrentWindow();

const SysTrayCopy = {
    [CPU_HASH_ITEM_ID]: (cpu: string) => `CPU Hashrate: ${cpu}`,
    [GPU_HASH_ITEM_ID]: (gpu: string) => `GPU Hashrate: ${gpu}`,
    [EARNINGS_ITEM_ID]: (earnings: string) => `Est earning: ${earnings} tXTM/day`,
};

export function useUpdateSystemTray() {
    const cachedMetrics = useRef<MinerMetrics>();

    const updateMenuItemEnabled = useCallback(async (itemId: string, enabled: boolean) => {
        const item = await menu.get(itemId);

        if (item) {
            const menuItem = item as MenuItem;
            const currentEnabled = await menuItem?.isEnabled();
            if (currentEnabled !== enabled) {
                await menuItem.setEnabled(enabled);
            }
        }
    }, []);

    const updateMenuItem = useCallback(async (itemId: string, itemText: string) => {
        const item = await menu.get(itemId);
        if (item && itemText) {
            await item.setText(itemText);
        }
    }, []);

    useEffect(() => {
        const handleUpdateMenu = () => {
            const { cpu, gpu } = cachedMetrics.current || {};

            // --- Update CPU
            const cpuHashItemText = cpu?.mining?.hash_rate ? `${formatHashrate(cpu?.mining?.hash_rate)}` : '-';
            updateMenuItem(CPU_HASH_ITEM_ID, SysTrayCopy[CPU_HASH_ITEM_ID](cpuHashItemText));
            // --- Update GPU
            const gpuHashItemText = gpu?.mining?.hash_rate ? `${formatHashrate(gpu?.mining?.hash_rate)}` : '-';
            updateMenuItem(GPU_HASH_ITEM_ID, SysTrayCopy[GPU_HASH_ITEM_ID](gpuHashItemText));
            // --- Update Total
            const cpu_est = cpu?.mining?.estimated_earnings || 0;
            const gpu_est = gpu?.mining?.estimated_earnings || 0;
            const total = cpu_est + gpu_est;
            const totalFormatted = total > 0 ? formatNumber(total, FormatPreset.TXTM_COMPACT) : '-';
            updateMenuItem(EARNINGS_ITEM_ID, SysTrayCopy[EARNINGS_ITEM_ID](totalFormatted));
        };
        handleUpdateMenu();
        const interval = setInterval(handleUpdateMenu, 1000 * 10); // 10s

        return () => clearInterval(interval);
    }, [updateMenuItem]);

    useEffect(() => {
        const ul = listen('miner_metrics', async ({ payload }) => {
            if (payload) {
                cachedMetrics.current = { ...payload } as MinerMetrics;
            }

            const minimized = await currentWindow.isMinimized();
            await updateMenuItemEnabled(UNMINIMIZE_ITEM_ID, minimized);
            await updateMenuItemEnabled(MINIMIZE_ITEM_ID, !minimized);
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [updateMenuItemEnabled]);
}
