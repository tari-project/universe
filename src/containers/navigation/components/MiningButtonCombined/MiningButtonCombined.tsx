import { useCallback } from 'react';
import { ButtonWrapper } from './styles.ts';
import StartButton from './StartButton/StartButton.tsx';
import StopButton from './StopButton/StopButton.tsx';
import { AnimatePresence } from 'motion/react';
import LoadingButton from './LoadingButton/LoadingButton.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';
import { startMining, stopMining } from '@app/store/actions/miningStoreActions.ts';
import type { ReactElement } from 'react';

export default function MiningButtonCombined() {
    const isAppSettingUp = useSetupStore((s) => !s.appUnlocked);
    const isMiningUnlocked = useSetupStore((s) => s.cpuMiningUnlocked || s.gpuMiningUnlocked);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMining = isCPUMining || isGPUMining;
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const isMiningButtonDisabled =
        isAppSettingUp || isMiningLoading || !isMiningControlsEnabled || !isMiningEnabled || !isMiningUnlocked;
    const isAppLoading = isAppSettingUp || isMiningLoading;

    const handleStartMining = useCallback(async () => {
        await startMining();
    }, []);

    const handleStopMining = useCallback(async () => {
        await stopMining();
    }, []);

    let button: ReactElement | null = null;

    if (isAppLoading) {
        button = <LoadingButton key="loading" />;
    } else if (isMining) {
        button = <StopButton key="stop" onClick={handleStopMining} disabled={isMiningButtonDisabled} />;
    } else {
        button = <StartButton key="start" onClick={handleStartMining} disabled={isMiningButtonDisabled} />;
    }

    return (
        <ButtonWrapper>
            <AnimatePresence mode="popLayout">{button}</AnimatePresence>
        </ButtonWrapper>
    );
}
