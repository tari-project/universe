import { useConfigUIStore, useMiningMetricsStore } from '@app/store';
import { useEffect, useRef, useState } from 'react';
import { setAnimationState } from '@tari-project/tari-tower';
import i18n from 'i18next';
import { removeXTMCryptoDecimals } from '@app/utils';

const REWARD_THRESHOLD = 2 * 1_000_000;

const fmtMatch = (value: number, max = 4) =>
    Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: value > 0 ? 1 : 0,
        maximumFractionDigits: max,
        notation: 'standard',
        style: 'decimal',
    }).format(value);

export function useCPURewards() {
    const pool_status = useMiningMetricsStore((s) => s.cpu_mining_status.pool_status);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const [unpaid, setUnpaid] = useState(pool_status?.unpaid || 0);
    const [unpaidM, setUnpaidM] = useState(Math.floor(removeXTMCryptoDecimals(unpaid) * 10_000) / 10_000);
    const [prevUnpaidM, setPrevUnpaidM] = useState(unpaidM);
    const [unpaidFMT, setUnpaidFTM] = useState(fmtMatch(unpaid));
    const [prevUnpaid, _] = useState(unpaidFMT);
    const [progressDiff, setProgressDiff] = useState(0);

    const prevFloored = useRef(Math.floor((pool_status?.unpaid || 0) / 1_000_000));

    useEffect(() => {
        const _unpaid = pool_status?.unpaid || 0;
        setUnpaid(_unpaid);
        setUnpaidM(Math.floor(removeXTMCryptoDecimals(_unpaid) * 10_000) / 10_000);
        setUnpaidFTM(fmtMatch(_unpaid));
    }, [pool_status?.unpaid]);

    useEffect(() => {
        if (unpaidM > prevUnpaidM) {
            const diff = unpaidM - prevUnpaidM;
            setProgressDiff(diff);
            const timer = setTimeout(() => setProgressDiff(0), 5000);
            setPrevUnpaidM(unpaidM);
            return () => clearTimeout(timer);
        }
    }, [unpaidM, prevUnpaidM]);

    useEffect(() => {
        const unpaidAboveThreshold = unpaid >= REWARD_THRESHOLD;
        if (!unpaidAboveThreshold) return;
        const floored = Math.floor(unpaid / 1_000_000);
        const canShowSuccess = floored === 2 && prevFloored.current !== floored && prevUnpaid !== '0.00';
        if (canShowSuccess) {
            if (visualMode) {
                setAnimationState('success', true);
            }

            prevFloored.current = floored;
        }
    }, [unpaid, visualMode, prevUnpaid]);

    return { progressDiff, unpaidFMT: fmtMatch(Math.floor(unpaidM * 100) / 100, 2) };
}
