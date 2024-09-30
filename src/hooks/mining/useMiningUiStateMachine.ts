import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { setAnimationState } from '@app/visuals';
import { useEffect } from 'react';

export const useUiMiningStateMachine = () => {
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const gpuIsMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isSetupFinished = !useAppStateStore((s) => s.isSettingUp);
    const isMining = cpuIsMining || gpuIsMining;

    const statusIndex = window?.glApp?.stateManager?.statusIndex;

    useEffect(() => {
        if (isMining) {
            setAnimationState('start');
        }
    }, [isMining, statusIndex]);

    useEffect(() => {
        if (isSetupFinished && !isMiningInitiated && !isMining && !isChangingMode) {
            setAnimationState('stop');
        }
    }, [isSetupFinished, isMiningInitiated, isMining, statusIndex, isChangingMode]);

    useEffect(() => {
        if (isMining && isChangingMode) {
            setAnimationState('stop');
        }
    }, [isMining, statusIndex, isChangingMode]);
};
