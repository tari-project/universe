import { useInterval } from '../useInterval.ts';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const setDisplayBlockTime = useMiningStore((s) => s.setDisplayBlockTime);
    const timerPaused = useMiningStore((s) => s.timerPaused);
    let timeSince = 0;
    useInterval(
        () => {
            if (timerPaused) {
                timeSince = 0;
            }
            if (!timerPaused) {
                timeSince += 1;
                const blockTime = calculateTimeSince(0, timeSince * INTERVAL);
                setDisplayBlockTime(blockTime);
            }
        },
        !timerPaused ? INTERVAL : null
    );
}
