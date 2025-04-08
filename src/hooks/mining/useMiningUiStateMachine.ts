import { useEffect } from 'react';
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

    const isMining = cpuIsMining || gpuIsMining;

    useEffect(() => {
        if (!setupComplete || !visualMode || visualModeLoading) return;

        const shouldStopAnimation = !isMining && !isMiningInitiated && !isChangingMode;

        if (shouldStopAnimation) {
            console.debug(
                'useUiMiningStateMachine',
                `Animation stopping: status=${animationStatus}, isMining=${isMining}`
            );
            setAnimationState('stop');
        } else if (isResuming) {
            console.debug(
                'useUiMiningStateMachine',
                `Animation starting: status=${animationStatus}, isResuming=${isResuming}`
            );
            setAnimationState('start');
        }
    }, [isChangingMode, isMining, isMiningInitiated, isResuming, setupComplete, visualMode, visualModeLoading]);
};
