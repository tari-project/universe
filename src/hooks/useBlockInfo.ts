import { useState } from 'react';
import { useInterval } from './useInterval.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

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
    const base_node = useAppStatusStore(useShallow((s) => s.base_node));
    const blockHeight = base_node?.block_height;
    const blockTime = base_node?.block_time || 1;
    const [timeSince, setTimeSince] = useState('');

    useInterval(() => {
        const { days, hours, minutes, seconds, hoursString } = calculateTimeSince(blockTime);

        if (days > 0) {
            setTimeSince(`${days} day${days === 1 ? '' : 's'}, ${hoursString}:${minutes}:${seconds}`);
        } else if (hours > 0) {
            setTimeSince(`${hoursString}:${minutes}:${seconds}`);
        } else {
            setTimeSince(`${minutes}:${seconds}`);
        }
    }, INTERVAL);

    return { timeSince, blockHeight };
}
