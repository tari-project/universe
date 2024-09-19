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
    const isMiningOnAppStartEnabled = useAppConfigStore((s) => s.mine_on_app_start);
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isSetupFinished = !useAppStateStore((s) => s.isSettingUp);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;
    const isMining = cpuIsMining || gpuIsMining;

    const hasStartedInit = useRef(false);

    useEffect(() => {
        async function startMiningAsync() {
            if (isSetupFinished && !!isMiningOnAppStartEnabled && !!isMiningEnabled && !hasStartedInit.current) {
                await startMining();
            }

            // Need to be seprated so when we toggle "Should start mining on app startup" it doesn't start mining but we start mining only after setup is finished
            if (isSetupFinished) {
                hasStartedInit.current = true;
            }
        }
        startMiningAsync();
    }, [startMining, isMiningOnAppStartEnabled, isMiningEnabled, isSetupFinished]);

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
        isMiningOnAppStartEnabled,
        isMiningInitiated,
        setIsChangingMode,
    ]);
};
