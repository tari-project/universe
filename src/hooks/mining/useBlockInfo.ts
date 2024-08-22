import { useInterval } from '../useInterval.ts';

import { useBaseNodeStatusStore } from '../../store/useBaseNodeStatusStore.ts';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const block_time = useBaseNodeStatusStore((s) => s.block_time);
    const setBlockTime = useMiningStore((s) => s.setBlockTime);
    const timerPaused = useMiningStore((s) => s.timerPaused);

    useInterval(
        () => {
            if (!timerPaused) {
                const blockTime = calculateTimeSince(block_time);
                setBlockTime(blockTime);
            }
        },
        !timerPaused ? INTERVAL : null
    );
}
