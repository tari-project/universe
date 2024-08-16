import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from './useInterval.ts';

import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useVisualisation } from './useVisualisation.ts';

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
    const [timeSince, setTimeSince] = useState<string | undefined>();
    const [isPaused, setIsPaused] = useState(false);

    const { handleFail } = useVisualisation();

    const heightRef = useRef(block_height);

    useEffect(() => {
        if (heightRef.current !== block_height) {
            setIsPaused(true);
            // handleFail();

            setIsPaused(false);
            heightRef.current = block_height;
        }
    }, [block_height, handleFail]);

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

    return timeSince;
}
