import { useShallow } from 'zustand/react/shallow';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '../useInterval.ts';

import { useBaseNodeStatusStore } from '../../store/useBaseNodeStatusStore.ts';
import { useCPUStatusStore } from '../../store/useCPUStatusStore.ts';
import { useVisualisation } from '../useVisualisation.ts';
import useBalanceInfo from '@app/hooks/mining/useBalanceInfo.ts';

const INTERVAL = 1000; // 1 sec

// helper
function calculateTimeSince(blockTime: number) {
    const now: Date = new Date();
    const past: Date = new Date(blockTime * 1000); // Convert seconds to milliseconds
    const diff: number = now.getTime() - past.getTime();

    // Convert the difference to days, hours, minutes, and seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const daysString = days > 0 ? `${days} day${days === 1 ? '' : 's'}, ` : '';
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const hoursString = hours.toString().padStart(2, '0');
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, '0');

    return {
        days,
        daysString,
        hours,
        minutes,
        seconds,
        hoursString,
    };
}

export function useBlockInfo() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const block_time = useBaseNodeStatusStore((s) => s.block_time);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [displayBlock, setDisplayBlock] = useState(block_height);
    const [blockHeightChanged, setBlockHeightChanged] = useState(false);
    const [timeSince, setTimeSince] = useState<{
        days: number;
        daysString: string;
        hours: number;
        hoursString: string;
        minutes: string;
        seconds: string;
    }>();
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
        setDisplayBlock(block_height);
    }, [block_height, setHasEarned, setResetSuccess]);

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
        const { days, daysString, hours, minutes, seconds, hoursString } = calculateTimeSince(block_time);
        setTimeSince({ days, daysString, hours, hoursString, minutes, seconds });
    }, [block_time]);

    useInterval(
        () => {
            handleTimer();
        },
        isMining && !isPaused ? INTERVAL : null
    );

    return { displayBlock, timeSince };
}
