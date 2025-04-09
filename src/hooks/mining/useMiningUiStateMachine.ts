import { useCallback, useEffect, useRef } from 'react';
import { setAnimationState, animationStatus, getTowerLogPrefix } from '@tari-project/tari-tower';

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
                console.debug(getTowerLogPrefix('debug'), `Animation stopped: status=${animationStatus}`);
                return;
            }

            if (retryCount >= maxRetries) {
                console.debug(
                    getTowerLogPrefix('debug'),
                    `Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`
                );
                return;
            }

            console.debug(
                getTowerLogPrefix('debug'),
                `Animation Stop attempt ${retryCount + 1}/${maxRetries}: status=${animationStatus}`
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
