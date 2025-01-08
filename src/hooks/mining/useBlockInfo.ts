import { useEffect, useMemo, useRef } from 'react';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useInterval } from '../helpers/useInterval';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const setDisplayBlockTime = useBlockchainVisualisationStore((s) => s.setDisplayBlockTime);
    const setDebugBlockTime = useBlockchainVisualisationStore((s) => s.setDebugBlockTime);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const block_time = useMiningStore((s) => s.base_node_metrics.block_time);

    const diff = useMemo(() => {
        const now = new Date();
        const btDate = new Date(block_time * 1000);
        return now.getTime() - btDate.getTime();
    }, [block_time]);

    const displayCounter = useRef(0);
    const debugCounter = useRef(diff);

    useEffect(() => {
        displayCounter.current = 0;
    }, [displayBlockHeight]);

    useEffect(() => {
        debugCounter.current = diff;
    }, [diff, displayBlockHeight]);

    useInterval(() => {
        displayCounter.current += INTERVAL;
        debugCounter.current += INTERVAL;

        const displayTime = calculateTimeSince(0, displayCounter.current);
        const debugTime = calculateTimeSince(0, debugCounter.current);
        setDisplayBlockTime(displayTime);
        setDebugBlockTime(debugTime);
    }, INTERVAL);
}
