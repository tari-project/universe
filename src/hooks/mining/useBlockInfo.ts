import { useInterval } from '../useInterval.ts';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useEffect, useRef } from 'react';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const setDisplayBlockTime = useMiningStore((s) => s.setDisplayBlockTime);
    const timerPaused = useMiningStore((s) => s.timerPaused);

    const timeSince = useRef(-1);

    useEffect(() => {
        if (timerPaused) {
            timeSince.current = -1;
        }
    }, [timerPaused]);

    useInterval(
        () => {
            timeSince.current += 1;
            if (!timerPaused) {
                const blockTime = calculateTimeSince(0, timeSince.current * INTERVAL);
                setDisplayBlockTime(blockTime);
            }
        },
        !timerPaused ? INTERVAL : null
    );
}
