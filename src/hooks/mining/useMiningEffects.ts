import { useCPUStatusStore } from '@app/store/useCPUStatusStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { useLayoutEffect } from 'react';
import { useVisualisation } from './useVisualisation';
import { useShallow } from 'zustand/react/shallow';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

// THIS hook is only for the edge cases of mining status from  BE not being in sync with our UI mining state

export const useMiningEffects = () => {
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = isCPUMining || isGPUMining;

    const handleVisual = useVisualisation();

    const setIsConnectionLostDuringMining = useMiningStore((s) => s.setIsConnectionLostDuringMining);
    const isMiningInProgress = useMiningStore((s) => s.isMiningInProgress);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const setMiningLoading = useMiningStore((s) => s.setMiningLoading);

    useLayoutEffect(() => {
        // shouldn't be needed any more, but in the case of the animation not starting when _actually_ starting to mine
        if (isMining && miningInitiated) {
            handleVisual('start');
            setMiningLoading(false);
        }
    }, [handleVisual, isMining, miningInitiated, setMiningLoading]);

    useLayoutEffect(() => {
        // in the case of isMining == false but mining should be in progress, means connection is lost
        if (isMiningInProgress && !isMining && !isChangingMode) {
            setIsConnectionLostDuringMining(true);
            handleVisual('pause');
        }
    }, [handleVisual, isChangingMode, isMining, isMiningInProgress, setIsConnectionLostDuringMining]);
};
