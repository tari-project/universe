import { useAppStateStore } from '@app/store/appStateStore';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { setAnimationState } from '@app/visuals';
import { useEffect } from 'react';
import { useMiningControls } from './useMiningControls';

export const useUiMiningStateMachine = () => {
    const { handleStart } = useMiningControls();

    const setIsChangingMode = useMiningStore((s) => s.setIsChangingMode);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);

    const isAutoMiningEnabled = useAppStatusStore((s) => s.auto_mining);

    const isGpuMiningEnabled = useAppStatusStore((s) => s.gpu_mining_enabled);
    const isCpuMiningEnabled = useAppStatusStore((s) => s.cpu_mining_enabled);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;

    const gpuIsMining = useGPUStatusStore((s) => s.is_mining);
    const cpuIsMining = useCPUStatusStore((s) => s.is_mining);
    const isMining = (isCpuMiningEnabled && cpuIsMining) || (isGpuMiningEnabled && gpuIsMining);

    const isSetupFinished = !useAppStateStore((s) => s.isSettingUp);

    useEffect(() => {
        if (isSetupFinished && isAutoMiningEnabled && isMiningEnabled) {
            handleStart();
        }
    }, [isSetupFinished]);

    useEffect(() => {
        if (isSetupFinished && isMiningEnabled && isMining) {
            setAnimationState('start');
            setIsChangingMode(false);
            return;
        }

        if (isSetupFinished && isMiningEnabled && !isMining && !isChangingMode) {
            setAnimationState('stop');
            return;
        }

        if (isSetupFinished && isMiningEnabled && isMining && isChangingMode) {
            setAnimationState('pause');
            return;
        }
    }, [
        isSetupFinished,
        isMiningEnabled,
        isChangingMode,
        isMining,
        isAutoMiningEnabled,
        window?.glApp?.stateManager.statusIndex,
    ]);
};
