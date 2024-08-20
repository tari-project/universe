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

    const { hasEarned, setHasEarned, successHeight, setSuccessHeight } = useBalanceInfo();
    const handleVisual = useVisualisation();
    const heightRef = useRef(block_height);

    useEffect(() => setBlockHeightChanged(heightRef.current !== block_height), [block_height]);
    useEffect(() => setShouldAnimate(blockHeightChanged || hasEarned), [blockHeightChanged, hasEarned]);

    const handleAnimation = useCallback(() => {
        setIsPaused(true);

        console.log('=============================================');
        console.log('block | ref | success =', block_height, heightRef.current, successHeight);
        console.log('=============================================');

        const currentIsWon = heightRef.current === successHeight;

        if (!currentIsWon && block_height !== successHeight) {
            console.log(`FAILED`);
            handleVisual('fail');
        }
        if (currentIsWon) {
            console.log(`EARNED`);
            handleVisual('success');
        }
        console.log('=============================================');
    }, [block_height, handleVisual, successHeight]);

    useEffect(() => {
        if (shouldAnimate) {
            const animationTimeout = hasEarned ? 1 : 3500;
            console.log('animationTimeout', animationTimeout);
            const timeout = setTimeout(() => {
                handleAnimation();
                setDisplayBlock(block_height);
                setHasEarned(false);
                setIsPaused(false);
                setSuccessHeight(undefined);
                heightRef.current = block_height;
            }, animationTimeout);
            return () => clearTimeout(timeout);
        }
    }, [hasEarned, block_height, handleAnimation, setHasEarned, shouldAnimate, setSuccessHeight]);

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
