import { useCPUStatusStore } from '@app/store/useCPUStatusStore';
import { useUIStore } from '@app/store/useUIStore';
import { useEffect, useRef } from 'react';
import { useVisualisation } from './useVisualisation';

export const useMiningEffects = () => {
    const isMining = useCPUStatusStore((s) => s.is_mining);
    const handleVisual = useVisualisation();

    const { isConnectionLostDuringMining, setIsConnectionLostDuringMining } = useUIStore((s) => ({
        isConnectionLostDuringMining: s.isConnectionLostDuringMining,
        setIsConnectionLostDuringMining: s.setIsConnectionLostDuringMining,
    }));

    const { isMiningInProgress, setIsMiningInProgress } = useUIStore((s) => ({
        isMiningInProgress: s.isMiningInProgress,
        setIsMiningInProgress: s.setIsMiningInProgress,
    }));

    const { isMiningEnabled } = useUIStore((s) => ({
        isMiningEnabled: s.isMiningEnabled,
    }));

    const { isChangingMode, setIsChangingMode } = useUIStore((s) => ({
        isChangingMode: s.isChangingMode,
        setIsChangingMode: s.setIsChangingMode,
    }));

    useEffect(() => {
        console.log('useMiningEffects', {
            isMining,
            isMiningEnabled,
            isConnectionLostDuringMining,
            isChangingMode,
            isMiningInProgress,
        });

        if (isMining && isMiningEnabled) {
            if (isConnectionLostDuringMining) setIsConnectionLostDuringMining(false);
            if (isChangingMode) setIsChangingMode(false);
            console.log('Useffect: handleVisual start');
            handleVisual('start');
            setIsMiningInProgress(true);
            return;
        }

        if (!isMining && !isMiningEnabled && isMiningInProgress) {
            if (isConnectionLostDuringMining) setIsConnectionLostDuringMining(false);
            console.log('Useffect: handleVisual stop');
            handleVisual('stop');
            setIsMiningInProgress(false);
            return;
        }

        if (!isMining && isMiningInProgress && !isChangingMode) {
            console.log('Useffect: handleVisual pause');
            setIsConnectionLostDuringMining(true);
            handleVisual('pause');
            return;
        }
    }, [handleVisual, isMining, isMiningEnabled, isConnectionLostDuringMining, isChangingMode, isMiningInProgress]);
};
