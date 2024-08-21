import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '../useInterval.ts';

import { useBaseNodeStatusStore } from '../../store/useBaseNodeStatusStore.ts';
import { useVisualisation } from './useVisualisation.ts';
import useBalanceInfo from '@app/hooks/mining/useBalanceInfo.ts';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo(enabled = false) {
    const setBlockTime = useMiningStore((s) => s.setBlockTime);
    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);

    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const block_time = useBaseNodeStatusStore((s) => s.block_time);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [blockHeightChanged, setBlockHeightChanged] = useState(false);

    const [isPaused, setIsPaused] = useState(false);

    const { hasEarned, setHasEarned, successHeight, setResetSuccess } = useBalanceInfo();
    const handleVisual = useVisualisation();
    const heightRef = useRef(block_height);
    const animating = useRef(false);

    useEffect(() => setBlockHeightChanged(heightRef.current !== block_height), [block_height]);
    useEffect(() => setShouldAnimate(blockHeightChanged || hasEarned), [blockHeightChanged, hasEarned]);

    const handleAnimation = useCallback(() => {
        const currentIsWon = heightRef.current === successHeight;
        if (!currentIsWon && block_height !== successHeight) {
            handleVisual('fail');
        }
        if (currentIsWon) {
            handleVisual('success');
        }
    }, [block_height, handleVisual, successHeight]);

    const handleReset = useCallback(() => {
        setHasEarned(false);
        setIsPaused(false);
        setResetSuccess();
        heightRef.current = block_height;
        animating.current = false;
        setDisplayBlockHeight(block_height);
    }, [setDisplayBlockHeight, block_height, setHasEarned, setResetSuccess]);

    useEffect(() => {
        if (shouldAnimate) {
            animating.current = true;
            setIsPaused(true);
            const animationTimeout = hasEarned ? 1 : 5000;
            const timeout = setTimeout(() => {
                handleAnimation();
                handleReset();
            }, animationTimeout);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [handleAnimation, handleReset, hasEarned, shouldAnimate]);

    const handleTimer = useCallback(() => {
        const blockTime = calculateTimeSince(block_time);
        setBlockTime(blockTime);
    }, [block_time, setBlockTime]);

    useInterval(
        () => {
            handleTimer();
        },
        !isPaused && enabled ? INTERVAL : null
    );
}
