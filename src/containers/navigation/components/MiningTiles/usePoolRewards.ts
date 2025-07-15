import { useConfigUIStore } from '@app/store';
import { useEffect, useState } from 'react';
import { setAnimationState } from '@tari-project/tari-tower';
import i18n from 'i18next';
import { removeXTMCryptoDecimals } from '@app/utils';
import { PoolStats } from '@app/types/app-status';

const fmtMatch = (value: number, max = 4) =>
    Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: value > 0 ? 1 : 0,
        maximumFractionDigits: max,
        notation: 'standard',
        style: 'decimal',
    }).format(value);

export function usePoolRewards(pool_stats?: PoolStats) {
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const [unpaid, setUnpaid] = useState(pool_stats?.unpaid || 0);
    const [unpaidM, setUnpaidM] = useState(Math.floor(removeXTMCryptoDecimals(unpaid) * 10_000) / 10_000);
    const [prevUnpaidM, setPrevUnpaidM] = useState(unpaidM);

    const [progressDiff, setProgressDiff] = useState(0);

    useEffect(() => {
        const _unpaid = pool_stats?.unpaid || 0;
        setUnpaid(_unpaid);
        setUnpaidM(Math.floor(removeXTMCryptoDecimals(_unpaid) * 10_000) / 10_000);
    }, [pool_stats?.unpaid]);

    useEffect(() => {
        if (unpaidM > prevUnpaidM) {
            const diff = unpaidM - prevUnpaidM;
            if (diff === unpaidM) return;
            setProgressDiff(diff);
            if (visualMode) {
                setAnimationState('success', true);
            }
            const timer = setTimeout(() => setProgressDiff(0), 5000);
            setPrevUnpaidM(unpaidM);
            return () => clearTimeout(timer);
        }
    }, [unpaidM, prevUnpaidM, visualMode]);

    return { progressDiff, unpaidFMT: fmtMatch(Math.floor(unpaidM * 100) / 100, 2) };
}
