import { useCallback, useEffect, useRef } from 'react';
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

    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    function clearStopTimeout() {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }
    }

    const forceAnimationStop = useCallback(() => {
        let retryCount = 0;
        const maxRetries = 15;
        const interval = 2000; // 2 seconds

        const attemptStop = () => {
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

            timeoutIdRef.current = setTimeout(() => {
                attemptStop();
            }, interval);
        };

        timeoutIdRef.current = setTimeout(() => {
            attemptStop();
        }, interval);

        return () => {
            clearStopTimeout();
        };
    }, []);

    useEffect(() => {
        if (noVisualMode) return;

        if (shouldStop) {
            forceAnimationStop();
        } else if (shouldStart) {
            setAnimationState('start');
            clearStopTimeout();
        }
    }, [forceAnimationStop, noVisualMode, shouldStart, shouldStop]);
};
