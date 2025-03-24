import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const useUiMiningStateMachine = () => {
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isResuming = useAppStateStore((state) => state.appResumePayload?.is_resuming);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeToggleLoading = useAppConfigStore((s) => s.visualModeToggleLoading);
    const isMining = cpuIsMining || gpuIsMining;

    const indexTrigger = animationStatus;

    useEffect(() => {
        let isLatestEffect = true;
        if (!visualMode || visualModeToggleLoading) return;
        const notStarted = !animationStatus || animationStatus == 'not-started';
        if (isMining && notStarted && !isResuming) {
            // Debounce animation state changes
            const timer = setTimeout(() => {
                if (isLatestEffect) {
                    setAnimationState('start');
                }
            }, 300);
            return () => {
                clearTimeout(timer);
                isLatestEffect = false;
            };
        }
    }, [indexTrigger, isMining, isResuming, visualMode, visualModeToggleLoading]);

    useEffect(() => {
        let isLatestEffect = true;
        if (!visualMode || visualModeToggleLoading) return;
        const notStopped = animationStatus !== 'not-started';
        const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
        const shouldStop = !isMining && notStopped && !preventStop;
        if (shouldStop) {
            // Debounce animation state changes
            const timer = setTimeout(() => {
                if (isLatestEffect) {
                    setAnimationState('stop');
                }
            }, 300);
            return () => {
                clearTimeout(timer);
                isLatestEffect = false;
            };
        }
    }, [indexTrigger, setupComplete, isMiningInitiated, isMining, isChangingMode, visualMode, visualModeToggleLoading]);
};
