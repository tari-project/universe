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
    const isResuming = useAppStateStore((state) => state.appResumePayload?.is_resuming);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeLoading = useAppConfigStore((s) => s.visualModeToggleLoading);

    const stateTrigger = animationStatus;
    const isMining = cpuIsMining || gpuIsMining;

    const notStarted = stateTrigger === 'not-started';
    const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
    const shouldStop = !isMining && !notStarted && !preventStop;
    const shouldStart = isMining && notStarted && !isResuming;

    const noVisualMode = !visualMode || visualModeLoading;

    const forceAnimationStop = useCallback(() => {
        let retryCount = 0;
        const maxRetries = 10;
        const interval = 1000 * 2; // 2 seconds
        let timeoutId: NodeJS.Timeout;

        const attemptStop = () => {
            if (timeoutId && animationStatus === 'started') {
                clearTimeout(timeoutId);
            }
            if (animationStatus === 'not-started') {
                console.debug(`tari-tower debug |Animation stopped: status=${animationStatus}`);
                return;
            }

            if (retryCount >= maxRetries) {
                console.debug(
                    `tari-tower debug | Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`
                );
                return;
            }

            console.debug(
                `tari-tower debug | Animation Stop attempt ${retryCount + 1}/${maxRetries}: status=${animationStatus}`
            );
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
        if (noVisualMode) return;

        if (shouldStop) {
            forceAnimationStop();
        } else if (shouldStart) {
            setAnimationState('start');
        }
    }, [forceAnimationStop, noVisualMode, shouldStart, shouldStop]);
};
