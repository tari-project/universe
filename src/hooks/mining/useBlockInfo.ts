import { useEffect, useMemo, useRef } from 'react';

import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';

import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useInterval } from '../helpers/useInterval';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const setDisplayBlockTime = useBlockchainVisualisationStore((s) => s.setDisplayBlockTime);
    const setDebugBlockTime = useBlockchainVisualisationStore((s) => s.setDebugBlockTime);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const block_time = useMiningMetricsStore((s) => s.base_node_status?.block_time);

    const diff = useMemo(() => {
        const now = new Date();
        const btDate = new Date(block_time * 1000);
        return now.getTime() - btDate.getTime();
    }, [block_time]);

    const displayCounter = useRef(0);
    const debugCounter = useRef(diff);

    useEffect(() => {
        displayCounter.current = 0;
        const displayTime = calculateTimeSince(0, 0);
        setDisplayBlockTime(displayTime);
    }, [displayBlockHeight, setDisplayBlockTime]);

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
