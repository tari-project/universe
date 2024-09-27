import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useEffect, useRef } from 'react';
import { useInterval } from '@app/hooks/useInterval';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';

const INTERVAL = 1000; // 1 sec

export function useBlockInfo() {
    const timeSinceLastAnimation = useRef(0);
    const setDisplayBlockTime = useBlockchainVisualisationStore((s) => s.setDisplayBlockTime);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const isCpuMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGpuMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isMining = isGpuMining || isCpuMining;

    useEffect(() => {
        timeSinceLastAnimation.current = 0;
    }, [displayBlockHeight, isMining]);

    useInterval(
        () => {
            timeSinceLastAnimation.current += 1;
            const blockTime = calculateTimeSince(0, timeSinceLastAnimation.current * INTERVAL);
            setDisplayBlockTime(blockTime);
        },
        isMining ? INTERVAL : null
    );
}
