import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';
import { animationStatus, setAnimationState, animationStatusIndex } from '@tari-project/tari-tower';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const useUiMiningStateMachine = () => {
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu.mining.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu.mining.is_mining);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeToggleLoading = useAppConfigStore((s) => s.visualModeToggleLoading);
    const isMining = cpuIsMining || gpuIsMining;

    const indexTrigger = animationStatusIndex;

    useEffect(() => {
        if (!visualMode || visualModeToggleLoading) return;
        const notStarted = !animationStatus || animationStatus == 'not-started' || animationStatus == 'stop';
        if (isMining && notStarted) {
            setAnimationState('start');
        }
    }, [indexTrigger, isMining, visualMode, visualModeToggleLoading]);

    useEffect(() => {
        if (!visualMode || visualModeToggleLoading) return;
        const notStopped = animationStatus !== 'not-started';
        const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
        const shouldStop = !isMining && notStopped && !preventStop;
        if (shouldStop) {
            setAnimationState('stop');
        }
    }, [indexTrigger, setupComplete, isMiningInitiated, isMining, isChangingMode, visualMode, visualModeToggleLoading]);
};
