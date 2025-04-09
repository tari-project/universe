import { useCallback, useEffect } from 'react';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';

import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const useUiMiningStateMachine = () => {
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeLoading = useAppConfigStore((s) => s.visualModeToggleLoading);

    const isMining = cpuIsMining || gpuIsMining;

    const forceAnimationStop = useCallback(() => {
        let retryCount = 0;
        const maxRetries = 10;
        const interval = 1000; // 1 second
        let timeoutId: NodeJS.Timeout;

        const attemptStop = () => {
            if (animationStatus === 'not-started') {
                console.debug(`Animation stopped: status=${animationStatus}`);
                return;
            }

            if (retryCount >= maxRetries) {
                console.debug(`Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`);
                return;
            }

            console.debug(`Animation Stop attempt ${retryCount + 1}/${maxRetries}: status=${animationStatus}`);
            setAnimationState('stop');
            retryCount++;

            timeoutId = setTimeout(() => {
                attemptStop();
            }, interval);
        };

        timeoutId = setTimeout(() => {
            attemptStop();
        }, interval);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    useEffect(() => {
        if (!setupComplete || !visualMode || visualModeLoading) return;

        const shouldStopAnimation = !isMining && !isMiningInitiated && !isChangingMode;

        if (shouldStopAnimation) {
            forceAnimationStop();
        }
    }, [isChangingMode, isMining, isMiningInitiated, setupComplete, visualMode, visualModeLoading, forceAnimationStop]);
};
