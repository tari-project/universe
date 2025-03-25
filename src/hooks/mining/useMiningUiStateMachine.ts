import { useEffect } from 'react';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';

import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useBlockchainVisualisationStore } from '@app/store';

export const useUiMiningStateMachine = () => {
    const setupComplete = useSetupStore((s) => s.setupComplete);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);
    const isResuming = useAppStateStore((state) => state.appResumePayload?.is_resuming);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeLoading = useAppConfigStore((s) => s.visualModeToggleLoading);
    const blockTime = useBlockchainVisualisationStore((s) => s.displayBlockTime);

    const stateTrigger = animationStatus;
    const isMining = cpuIsMining || gpuIsMining;
    const blockTimeTrigger = Number(blockTime?.seconds) % 5 === 0;

    useEffect(() => {
        if (!visualMode || visualModeLoading) return;

        const notStarted = stateTrigger === 'not-started';
        const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
        const shouldStop = !isMining && !notStarted && !preventStop;
        const shouldStartAnimation = isMining && notStarted && !isResuming;
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
        isResuming,
        setupComplete,
        stateTrigger,
        visualMode,
        visualModeLoading,
    ]);
};
