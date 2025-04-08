import { useEffect } from 'react';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';

import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useBlockchainVisualisationStore, useConfigUIStore } from '@app/store';

export const useUiMiningStateMachine = () => {
    const setupComplete = useSetupStore((s) => s.appUnlocked);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const visualModeLoading = useConfigUIStore((s) => s.visualModeToggleLoading);
    const blockTime = useBlockchainVisualisationStore((s) => s.displayBlockTime);

    const stateTrigger = animationStatus;
    const isMining = cpuIsMining || gpuIsMining;
    const blockTimeTrigger = Number(blockTime?.seconds) % 5 === 0;

    useEffect(() => {
        if (!visualMode || visualModeLoading) return;

        const notStarted = stateTrigger === 'not-started';
        const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
        const shouldStop = !isMining && !notStarted && !preventStop;
        const shouldStartAnimation = isMining && notStarted;
        if (shouldStop) {
            setAnimationState('stop');
        } else if (shouldStartAnimation) {
            setAnimationState('start');
        }
    }, [
        blockTimeTrigger, // do not remove - needed to re-trigger these checks since `animationStatus` takes a while to come back updated
        isChangingMode,
        isMining,
        isMiningInitiated,
        setupComplete,
        stateTrigger,
        visualMode,
        visualModeLoading,
    ]);
};
