import { useCallback, useEffect, useRef } from 'react';
import { setAnimationState, animationStatus, getTowerLogPrefix } from '@tari-project/tari-tower';

import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigUIStore, useUIStore } from '@app/store';

export const useUiMiningStateMachine = () => {
    const setupComplete = useSetupStore((s) => s.appUnlocked);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const visualModeLoading = useConfigUIStore((s) => s.visualModeToggleLoading);
    const towerInitalized = useUIStore((s) => s.towerInitalized);

    const stateTrigger = animationStatus;
    const isMining = cpuIsMining || gpuIsMining;

    const notStarted = stateTrigger === 'not-started';
    const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
    const shouldStop = !isMining && !notStarted && !preventStop;
    const shouldStart = isMining && notStarted;

    const noVisualMode = !visualMode || visualModeLoading;

    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);

    function clearStopTimeout() {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }
    }

    const forceAnimationStop = useCallback(() => {
        const maxRetries = 15;
        const interval = 2000; // 2 seconds

        const attemptStop = () => {
            if (animationStatus === 'not-started' || stateTrigger === 'not-started') {
                console.info(getTowerLogPrefix('info'), `Animation stopped: status=${animationStatus}`);
                retryCountRef.current = 0;
                return;
            }

            if (retryCountRef.current >= maxRetries) {
                console.info(
                    getTowerLogPrefix('warn'),
                    `Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`
                );
                return;
            }

            setAnimationState('stop');

            timeoutIdRef.current = setTimeout(() => {
                attemptStop();
            }, interval);

            retryCountRef.current += 1;
        };

        attemptStop();

        return () => {
            clearStopTimeout();
        };
    }, [stateTrigger]);

    useEffect(() => {
        if (noVisualMode || !towerInitalized) return;
        if (shouldStop) {
            forceAnimationStop();
            return;
        }
        if (shouldStart) {
            setAnimationState('start');
        }
        return () => {
            clearStopTimeout();
        };
    }, [towerInitalized, forceAnimationStop, noVisualMode, shouldStart, shouldStop]);
};
