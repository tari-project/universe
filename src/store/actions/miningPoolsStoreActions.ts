import { PoolStats } from '@app/types/app-status';
import { PoolType, RewardValues, useMiningPoolsStore } from '../useMiningPoolsStore';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import i18n from 'i18next';
import { removeXTMCryptoDecimals } from '@app/utils';
import { useConfigPoolsStore } from '../useAppConfigStore';
import { useMiningMetricsStore } from '@app/store';

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

function parseValues(
    stats: PoolStats,
    currentStats?: PoolStats,
    currentRewards?: RewardValues
): { stats?: PoolStats; unpaidFMT?: string; diff?: number | null; canTriggerAnimation?: boolean } {
    const shouldUpdate = canUpdate(stats, currentStats);
    if (!shouldUpdate) {
        return { stats: currentStats, unpaidFMT: currentRewards?.unpaidFMT, diff: currentRewards?.rewardValue };
    }

    const isMining =
        useMiningMetricsStore.getState().cpu_mining_status.is_mining ||
        useMiningMetricsStore.getState().gpu_mining_status.is_mining;
    const unpaid = stats?.unpaid ? Math.floor(removeXTMCryptoDecimals(stats?.unpaid) * 10_000) / 10_000 : 0;
    const unpaidFMT = unpaid ? fmtMatch(Math.floor(unpaid * 100) / 100, 2) : '0';

    const canTriggerAnimation = currentRewards?.rewardValue !== null && isMining;

    const _diff = stats?.unpaid ? stats?.unpaid - (currentStats?.unpaid || 0) : 0;
    const diff = Math.floor(removeXTMCryptoDecimals(_diff) * 10_000) / 10_000;
    return {
        stats,
        unpaidFMT,
        diff,
        canTriggerAnimation,
    };
}

export const clearCurrentSuccessValue = (type: PoolType) => {
    if (type === 'GPU') {
        useMiningPoolsStore.setState((c) => ({ ...c, gpuRewards: { ...c.gpuRewards, rewardValue: 0 } }));
    }
    if (type === 'CPU') {
        useMiningPoolsStore.setState((c) => ({ ...c, cpuRewards: { ...c.cpuRewards, rewardValue: 0 } }));
    }
};

export const setCpuPoolStats = (cpuPoolStats: Record<string, PoolStats>) => {
    const currentSelectedPool = useConfigPoolsStore.getState().selected_cpu_pool;

    if (!currentSelectedPool) return;
    if (!cpuPoolStats[currentSelectedPool]) return;

    useMiningPoolsStore.setState((c) => {
        const parsed = parseValues(cpuPoolStats[currentSelectedPool], c.cpuPoolStats, c.cpuRewards);

        return {
            ...c,
            cpuPoolStats: parsed.stats,
            cpuRewards: {
                ...c.cpuRewards,
                rewardValue: parsed.canTriggerAnimation ? parsed.diff : 0,
                unpaidFMT: parsed.unpaidFMT,
            },
        };
    });
};
export const setGpuPoolStats = (gpuPoolStats: Record<string, PoolStats>) => {
    const currentSelectedPool = useConfigPoolsStore.getState().selected_gpu_pool;
    if (!currentSelectedPool) return;
    if (!gpuPoolStats[currentSelectedPool]) return;

    useMiningPoolsStore.setState((c) => {
        const parsed = parseValues(gpuPoolStats[currentSelectedPool], c.gpuPoolStats, c.gpuRewards);
        return {
            ...c,
            gpuPoolStats: parsed.stats,
            gpuRewards: {
                ...c.gpuRewards,
                rewardValue: parsed.canTriggerAnimation ? parsed.diff : 0,
                unpaidFMT: parsed.unpaidFMT,
            },
        };
    });
};
