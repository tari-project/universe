import { MinerMetrics } from '@app/types/app-status';
import { menu } from '@app/utils';
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

    const updateMenuItem = useCallback(async (itemId: string, itemText: string) => {
        const item = await menu.get(itemId);
        if (item) {
            await item.setText(itemText);
        }
    }, []);

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

    useEffect(() => {
        const cpu_h = metrics?.cpu?.mining?.hash_rate || 0;
        if (cpu_h) {
            const cpuHashItemText = `CPU Hashrate: ${formatHashrate(cpu_h)}`;
            updateMenuItem('cpu_hashrate', cpuHashItemText);
        }
    }, [metrics?.cpu?.mining?.hash_rate, updateMenuItem]);

    useEffect(() => {
        const gpu_h = metrics?.gpu?.mining?.hash_rate || 0;
        if (gpu_h) {
            const gpuHashItemText = `GPU Hashrate: ${formatHashrate(gpu_h)}`;
            updateMenuItem('gpu_hashrate', gpuHashItemText);
        }
    }, [metrics?.gpu?.mining?.hash_rate, updateMenuItem]);

    useEffect(() => {
        if (totalEarningsFormatted !== '0') {
            const estEarningsItemText = `Est earning: ${totalEarningsFormatted} tXTM/day`;
            updateMenuItem('estimated_earning', estEarningsItemText);
        }
    }, [totalEarningsFormatted, updateMenuItem]);
}
