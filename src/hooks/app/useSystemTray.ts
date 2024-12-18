import {
    menu,
    CPU_HASH_ITEM_ID,
    GPU_HASH_ITEM_ID,
    EARNINGS_ITEM_ID,
    UNMINIMIZE_ITEM_ID,
    MINIMIZE_ITEM_ID,
} from '@app/utils';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo } from 'react';

import { formatHashrate, formatNumber, FormatPreset } from '@app/utils';
import { MenuItem } from '@tauri-apps/api/menu/menuItem';
import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useUpdateSystemTray() {
    const metrics = useMiningStore();

    const totalEarningsFormatted = useMemo(() => {
        const cpu_est = metrics?.cpu?.mining?.estimated_earnings || 0;
        const gpu_est = metrics?.gpu?.mining?.estimated_earnings || 0;
        const total = cpu_est + gpu_est;
        return total > 0 ? formatNumber(total, FormatPreset.TXTM_COMPACT) : '0';
    }, [metrics]);

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
    const updateMenuItem = useCallback(async ({ itemId, itemText }: { itemId: string; itemText?: string }) => {
        const item = await menu?.get(itemId);
        if (item && itemText) {
            await item?.setText(itemText);
        }
    }, []);

    const items = useMemo(() => {
        const { cpu, gpu } = metrics || {};
        const cpu_h = cpu?.mining?.hash_rate || 0;
        const gpu_h = gpu?.mining?.hash_rate || 0;

        const cpuHashItemText = `CPU Hashrate: ${cpu_h ? `${formatHashrate(cpu_h)}` : '-'}`;
        const gpuHashItemText = `GPU Hashrate: ${gpu_h ? `${formatHashrate(gpu_h)}` : '-'}`;
        const estEarningsItemText = `Est earning: ${totalEarningsFormatted !== '0' ? totalEarningsFormatted : '-'} tXTM/day`;

        return [
            { itemId: CPU_HASH_ITEM_ID, itemText: cpuHashItemText },
            { itemId: GPU_HASH_ITEM_ID, itemText: gpuHashItemText },
            { itemId: EARNINGS_ITEM_ID, itemText: estEarningsItemText },
        ];
    }, [metrics, totalEarningsFormatted]);

    useEffect(() => {
        items?.forEach(async (item) => {
            await updateMenuItem({ ...item });
        });
    }, [items, updateMenuItem]);

    useEffect(() => {
        const ul = listen('tray-event', async ({ payload }: { payload?: { itemId: string } }) => {
            if (payload) {
                await updateMenuItemEnabled(UNMINIMIZE_ITEM_ID, payload.itemId !== UNMINIMIZE_ITEM_ID);
                await updateMenuItemEnabled(MINIMIZE_ITEM_ID, payload.itemId !== MINIMIZE_ITEM_ID);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [updateMenuItemEnabled]);
}
