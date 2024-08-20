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
    const [timeSince, setTimeSince] = useState<string | undefined>();
    const [isPaused, setIsPaused] = useState(false);

    const { hasEarned, setHasEarned, successHeight, setSuccessHeight } = useBalanceInfo();
    const handleVisual = useVisualisation();
    const heightRef = useRef(block_height);

    useEffect(() => setBlockHeightChanged(heightRef.current !== block_height), [block_height]);
    useEffect(() => setShouldAnimate(blockHeightChanged || hasEarned), [blockHeightChanged, hasEarned]);

    const handleAnimation = useCallback(() => {
        setIsPaused(true);
        console.log(`block_height= ${block_height}`);
        console.log(`heightRef.current= ${heightRef.current}`);
        console.log(`successHeight= ${successHeight}`);

        const currentIsWon = heightRef.current === successHeight;

        if (!currentIsWon && block_height !== successHeight) {
            console.log(`got to fail`);
            handleVisual('fail');
        }
        if (currentIsWon) {
            console.log(`got to success`);
            handleVisual('success');
        }
    }, [block_height, handleVisual, successHeight]);

    useEffect(() => {
        if (shouldAnimate) {
            const timeout = setTimeout(
                () => {
                    handleAnimation();
                    setDisplayBlock(block_height);
                    setHasEarned(false);
                    setIsPaused(false);
                    setSuccessHeight(undefined);
                    heightRef.current = block_height;
                },
                hasEarned ? 1 : 1500
            );
            return () => clearTimeout(timeout);
        }
    }, [hasEarned, block_height, handleAnimation, setHasEarned, shouldAnimate, setSuccessHeight]);

    const handleTimer = useCallback(() => {
        const { days, hours, minutes, seconds, hoursString } = calculateTimeSince(block_time);
        if (days > 0) {
            setTimeSince(`${days} day${days === 1 ? '' : 's'}, ${hoursString}:${minutes}:${seconds}`);
        } else if (hours > 0) {
            setTimeSince(`${hoursString}:${minutes}:${seconds}`);
        } else {
            setTimeSince(`${minutes}:${seconds}`);
        }
    }, [block_time]);

    useInterval(
        () => {
            handleTimer();
        },
        isMining && !isPaused ? INTERVAL : null
    );

    return { displayBlock, timeSince };
}
