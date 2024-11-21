import { MinerMetrics } from '@app/types/app-status';
import { menu, CPU_HASH_ITEM_ID, GPU_HASH_ITEM_ID, EARNINGS_ITEM_ID } from '@app/utils';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { formatHashrate } from '@app/utils/formatHashrate';
import { useBalanceFormatter } from '@app/utils/formatBalance';

export function useUpdateSystemTray() {
    const [metrics, setMetrics] = useState<MinerMetrics>();

    const formatBalance = useBalanceFormatter();

    const totalEarningsFormatted = useMemo(() => {
        const cpu_est = metrics?.cpu?.mining?.estimated_earnings || 0;
        const gpu_est = metrics?.gpu?.mining?.estimated_earnings || 0;
        return formatBalance(cpu_est + gpu_est);
    }, [formatBalance, metrics]);

    const updateMenuItem = useCallback(async ({ itemId, itemText }: { itemId: string; itemText: string }) => {
        const item = await menu.get(itemId);
        if (item) {
            await item.setText(itemText);
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
        items.forEach(async (item) => {
            await updateMenuItem({ ...item });
        });
    }, [items, updateMenuItem]);

    useEffect(() => {
        const ul = listen('miner_metrics', ({ payload }) => {
            if (payload) {
                setMetrics(payload as MinerMetrics);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, []);
}
