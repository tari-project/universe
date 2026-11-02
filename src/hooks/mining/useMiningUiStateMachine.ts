import { useCallback, useEffect, useRef, useState } from 'react';
import { setAnimationState, getCurrentAnimationState, getTowerLogPrefix } from '@tari-project/tari-tower';

import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useConfigUIStore, useUIStore } from '@app/store';

export const useUiMiningStateMachine = () => {
    const [shouldStop, setShouldStop] = useState(false);
    const [shouldStart, setShouldStart] = useState(false);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const visualModeLoading = useConfigUIStore((s) => s.visualModeToggleLoading);
    const towerInitalized = useUIStore((s) => s.towerInitalized);
    const preventStop = isMiningInitiated || isChangingMode;
    const isMining = cpuIsMining || gpuIsMining;

    const noVisualMode = !visualMode || visualModeLoading;

    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    const clearStopTimeout = useCallback(() => {
        if (timeoutIdRef.current !== null) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }
    }, []);

    const forceAnimationStop = useCallback(() => {
        clearStopTimeout();

        let retryCount = 0;
        const maxRetries = 15;
        const interval = 1000;

        if (shouldStart) return;

        const attemptStop = () => {
            timeoutIdRef.current = null;
            const animationStatus = getCurrentAnimationState();
            if (animationStatus === 'NOT_STARTED') {
                console.info(getTowerLogPrefix('info'), `Animation stopped: status=${animationStatus}`);
                return;
            }

            if (retryCount >= maxRetries) {
                console.info(
                    getTowerLogPrefix('warn'),
                    `Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`
                );
                return;
            }

            setAnimationState('stop');
            retryCount++;

            timeoutIdRef.current = setTimeout(() => {
                attemptStop();
            }, interval);
        };

        timeoutIdRef.current = setTimeout(() => {
            attemptStop();
        }, interval);
    }, [clearStopTimeout, shouldStart]);

    useEffect(() => {
        const state = getCurrentAnimationState();
        const notStarted = state === 'NOT_STARTED';
        if (isMining) {
            setShouldStart(isMining && notStarted);
            setShouldStop(false);
        } else {
            setShouldStart(false);
            setShouldStop(!notStarted && !preventStop);
        }
    }, [isMining, preventStop]);

    useEffect(() => {
        if (noVisualMode || !towerInitalized) {
            clearStopTimeout();
            return;
        }

        if (shouldStop) {
            forceAnimationStop();
        } else if (shouldStart) {
            clearStopTimeout();
            setAnimationState('start');
        }

        return () => {
            clearStopTimeout();
        };
    }, [towerInitalized, forceAnimationStop, clearStopTimeout, noVisualMode, shouldStart, shouldStop]);
};
