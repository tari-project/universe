import { useInterval } from '../useInterval.ts';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useRef } from 'react';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const timeSince = useRef(0);
    const setDisplayBlockTime = useMiningStore((s) => s.setDisplayBlockTime);
    const timerPaused = useMiningStore((s) => s.timerPaused);

    console.log(`timerPaused= ${timerPaused}`);
    console.log(`timeSince.current= ${timeSince.current}`);
    useInterval(
        () => {
            if (timerPaused) {
                timeSince.current = 0;
            }
            if (!timerPaused) {
                timeSince.current += 1;
                const blockTime = calculateTimeSince(0, timeSince.current * INTERVAL);
                setDisplayBlockTime(blockTime);
            }
        },
        !timerPaused ? INTERVAL : null
    );
}
