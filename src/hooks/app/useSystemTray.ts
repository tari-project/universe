import { MinerMetrics } from '@app/types/app-status';
import { menu, about, separator, minimize } from '@app/utils';
import { listen } from '@tauri-apps/api/event';
import { PredefinedMenuItem } from '@tauri-apps/api/menu/predefinedMenuItem';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuOptions } from '@tauri-apps/api/menu/menu';

import { formatHashrate } from '@app/utils/formatHashrate';
import { useBalanceFormatter } from '@app/utils/formatBalance';

const currItems = await menu.get('Separator');
export function useUpdateSystemTray() {
    const [metrics, setMetrics] = useState<MinerMetrics>();
    const formatBalance = useBalanceFormatter();

    const totalEarningsFormatted = useMemo(() => {
        const cpu_est = metrics?.cpu?.mining?.estimated_earnings || 0;
        const gpu_est = metrics?.gpu?.mining?.estimated_earnings || 0;
        return formatBalance(cpu_est + gpu_est);
    }, [formatBalance, metrics]);

    const updatedMenuItems = useMemo(() => {
        const cpu_h = metrics?.cpu?.mining?.hash_rate || 0;
        const gpu_h = metrics?.gpu?.mining?.hash_rate || 0;
        return [
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
            {
                id: 'estimated_earning',
                text: `Est earning: ${totalEarningsFormatted !== '0' ? totalEarningsFormatted : '-'} tXTM/day`,
                enabled: false,
            },
        ] as MenuOptions['items'];
    }, [totalEarningsFormatted]);
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

    // const updateMenu = useCallback(async () => {
    //     if (menu) {
    //         if (updatedMenuItems) {
    //             // await menu.insert(updatedMenuItems, 1);
    //         }
    //     }
    // }, []);
    //
    // useEffect(() => {
    //     updateMenu();
    // }, []);
}
