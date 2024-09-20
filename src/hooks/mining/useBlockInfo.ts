import { useInterval } from '../useInterval.ts';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const setDisplayBlockTime = useMiningStore((s) => s.setDisplayBlockTime);
    const timerPaused = useMiningStore((s) => s.timerPaused);
    const block_time = useMiningStore((s) => s.base_node.block_time);

    useInterval(
        () => {
            if (!timerPaused) {
                const blockTime = calculateTimeSince(block_time);
                setDisplayBlockTime(blockTime);
            }
        },
        !timerPaused ? INTERVAL : null
    );
}
