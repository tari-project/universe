import {
    menu,
    CPU_HASH_ITEM_ID,
    GPU_HASH_ITEM_ID,
    EARNINGS_ITEM_ID,
    UNMINIMIZE_ITEM_ID,
    MINIMIZE_ITEM_ID,
} from '@app/utils';

import { useCallback, useDeferredValue, useEffect, useRef } from 'react';

import { formatHashrate, formatNumber, FormatPreset } from '@app/utils';
import { MenuItem } from '@tauri-apps/api/menu/menuItem';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';

const SysTrayCopy = {
    [CPU_HASH_ITEM_ID]: (cpu: string) => `CPU Hashrate: ${cpu}`,
    [GPU_HASH_ITEM_ID]: (gpu: string) => `GPU Hashrate: ${gpu}`,
    [EARNINGS_ITEM_ID]: (earnings: string) => `Est earning: ${earnings} tXTM/day`,
};

const currentWindow = getCurrentWindow();
export function useUpdateSystemTray() {
    const metrics = useMiningStore();
    const deferredMetrics = useDeferredValue(metrics);
    const minimizedRef = useRef<boolean>();

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
        const item = await menu?.get(itemId);
        if (item && itemText) {
            await item?.setText(itemText);
        }
    }, []);

    const handleUpdateMenu = useCallback(
        async (metrics) => {
            const { cpu, gpu } = metrics || {};
            const minimized = await currentWindow.isMinimized();

            if (minimizedRef.current !== minimized) {
                minimizedRef.current = minimized;
                await updateMenuItemEnabled(UNMINIMIZE_ITEM_ID, minimized);
                await updateMenuItemEnabled(MINIMIZE_ITEM_ID, !minimized);
            }

            // --- Update CPU
            const cpuHashItemText = cpu?.mining?.hash_rate ? `${formatHashrate(cpu?.mining?.hash_rate)}` : '-';
            await updateMenuItem(CPU_HASH_ITEM_ID, SysTrayCopy[CPU_HASH_ITEM_ID](cpuHashItemText));
            // --- Update GPU
            const gpuHashItemText = gpu?.mining?.hash_rate ? `${formatHashrate(gpu?.mining?.hash_rate)}` : '-';
            await updateMenuItem(GPU_HASH_ITEM_ID, SysTrayCopy[GPU_HASH_ITEM_ID](gpuHashItemText));
            // --- Update Total
            const cpu_est = cpu?.mining?.estimated_earnings || 0;
            const gpu_est = gpu?.mining?.estimated_earnings || 0;
            const total = cpu_est + gpu_est;
            const totalFormatted = total > 0 ? formatNumber(total, FormatPreset.TXTM_COMPACT) : '-';
            await updateMenuItem(EARNINGS_ITEM_ID, SysTrayCopy[EARNINGS_ITEM_ID](totalFormatted));
        },
        [updateMenuItem, updateMenuItemEnabled]
    );

    useEffect(() => {
        if (metrics !== deferredMetrics) {
            handleUpdateMenu(deferredMetrics);
        }
    }, [deferredMetrics, handleUpdateMenu, metrics]);
}
