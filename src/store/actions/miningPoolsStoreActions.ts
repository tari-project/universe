import { PoolStats } from '@app/types/app-status';
import { useMiningPoolsStore } from '../useMiningPoolsStore';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import i18n from 'i18next';
import { removeXTMCryptoDecimals } from '@app/utils';

const fmtMatch = (value: number, max = 4) =>
    Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: value > 0 ? 1 : 0,
        maximumFractionDigits: max,
        notation: 'standard',
        style: 'decimal',
    }).format(value);

function canUpdate(stats: PoolStats, currentStats?: PoolStats): boolean {
    if (!currentStats) return true;
    return !deepEqual(currentStats, stats);
}

function parseValues(stats: PoolStats, current?: PoolStats): { stats?: PoolStats; unpaidFMT?: string; diff?: number } {
    const shouldUpdate = canUpdate(stats, current);

    console.debug(`shouldUpdate= `, shouldUpdate);
    if (!shouldUpdate) return { stats: current };

    const unpaid = Math.floor(removeXTMCryptoDecimals(stats.unpaid) * 10_000) / 10_000;
    const unpaidFMT = fmtMatch(Math.floor(unpaid * 100) / 100, 2);
    const diff = stats.unpaid - (current?.unpaid || 0);

    return {
        stats,
        unpaidFMT,
        diff,
    };
}

export const setCpuPoolStats = (cpuPoolStats: PoolStats) =>
    useMiningPoolsStore.setState((c) => {
        console.debug(`hi CPU`);
        const parsed = parseValues(cpuPoolStats, c.cpuPoolStats);
        console.debug(`CPU`, parsed);
        return {
            ...c,
            cpuPoolStats: parsed.stats,
            cpuRewards: { ...c.cpuRewards, rewardValue: parsed.diff, unpaidFMT: parsed.unpaidFMT },
        };
    });

export const setGpuPoolStats = (gpuPoolStats: PoolStats) =>
    useMiningPoolsStore.setState((c) => {
        console.debug(`hi GPU`);

        const parsed = parseValues(gpuPoolStats, c.gpuPoolStats);
        console.debug(`GPU`, parsed);
        return {
            ...c,
            gpuPoolStats: parsed.stats,
            gpuRewards: { ...c.gpuRewards, rewardValue: parsed.diff, unpaidFMT: parsed.unpaidFMT },
        };
    });
