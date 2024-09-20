import { useAppStateStore } from '@app/store/appStateStore';
import { useMiningStore } from '@app/store/useMiningStore';
import { setAnimationState } from '@app/visuals';
import { useEffect, useRef } from 'react';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export const useUiMiningStateMachine = () => {
    const startMining = useMiningStore((s) => s.startMining);
    const setIsChangingMode = useMiningStore((s) => s.setIsChangingMode);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const cpuIsMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const gpuIsMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isAutoMiningEnabled = useAppConfigStore((s) => s.auto_mining);
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isSetupFinished = !useAppStateStore((s) => s.isSettingUp);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;
    const isMining = cpuIsMining || gpuIsMining;

    const hasStartedInit = useRef(false);

    useEffect(() => {
        async function startMiningAsync() {
            if (isSetupFinished && !!isAutoMiningEnabled && !!isMiningEnabled && !hasStartedInit.current) {
                await startMining();
                hasStartedInit.current = true;
            }
        }
        startMiningAsync();
    }, [startMining, isAutoMiningEnabled, isMiningEnabled, isSetupFinished]);

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
