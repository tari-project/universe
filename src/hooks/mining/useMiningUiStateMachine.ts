import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { setAnimationState } from '@app/visuals';
import { useEffect } from 'react';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

export const useUiMiningStateMachine = () => {
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isResuming = useAppStateStore((state) => state.appResumePayload?.is_resuming);
    const setupComplete = useAppStateStore((s) => s.setupComplete);
    const isMining = cpuIsMining || gpuIsMining;

    const statusIndex = window?.glApp?.stateManager?.statusIndex;

    useEffect(() => {
        const status = window?.glApp?.stateManager?.status;
        const notStarted = !status || status == 'not-started' || status == 'stop';
        if (isMining && notStarted && !isResuming) {
            setAnimationState('start');
        }
    }, [statusIndex, isMining, isResuming]);

    useEffect(() => {
        const notStopped = window?.glApp?.stateManager?.status !== 'not-started';
        const preventStop = !setupComplete || isMiningInitiated || isChangingMode;
        const shouldStop = !isMining && notStopped && !preventStop;
        if (shouldStop) {
            setAnimationState('stop');
        }
    }, [statusIndex, setupComplete, isMiningInitiated, isMining, isChangingMode]);
};
