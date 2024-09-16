import { useAppStateStore } from '@app/store/appStateStore';
import { useAppStatusStore } from '@app/store/useAppStatusStore';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { setAnimationState } from '@app/visuals';
import { useEffect, useRef } from 'react';
import { useMiningControls } from './useMiningControls';
import { useShallow } from 'zustand/react/shallow';

export const useUiMiningStateMachine = () => {
    const { handleStart } = useMiningControls();

    const isMiningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const setIsChangingMode = useMiningStore(useShallow((s) => s.setIsChangingMode));
    const isChangingMode = useMiningStore(useShallow((s) => s.isChangingMode));

    const isAutoMiningEnabled = useAppStatusStore(useShallow((s) => s.auto_mining));

    const isGpuMiningEnabled = useAppStatusStore(useShallow((s) => s.gpu_mining_enabled));
    const isCpuMiningEnabled = useAppStatusStore(useShallow((s) => s.cpu_mining_enabled));
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;

    const gpuIsMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const cpuIsMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = cpuIsMining || gpuIsMining;
    const isSetupFinished = !useAppStateStore(useShallow((s) => s.isSettingUp));

    const hasStartedInit = useRef(false);

    useEffect(() => {
        if (isSetupFinished && !!isAutoMiningEnabled && !!isMiningEnabled && !hasStartedInit.current) {
            handleStart();
            hasStartedInit.current = true;
        }
    }, [handleStart, isAutoMiningEnabled, isMiningEnabled, isSetupFinished]);

    const statusIndex = window?.glApp?.stateManager?.statusIndex;

    useEffect(() => {
        if (isSetupFinished && isMiningEnabled && isMining) {
            setAnimationState('start');
            setIsChangingMode(false);
            return;
        }

        if (isSetupFinished && isMiningEnabled && !isMiningInitiated && !isMining && !isChangingMode) {
            setAnimationState('stop');
            return;
        }

        if (isSetupFinished && isMiningEnabled && isMining && isChangingMode) {
            setAnimationState('pause');
            return;
        }
    }, [
        statusIndex,
        isSetupFinished,
        isMiningEnabled,
        isChangingMode,
        isMining,
        isAutoMiningEnabled,
        isMiningInitiated,
        setIsChangingMode,
    ]);
};
