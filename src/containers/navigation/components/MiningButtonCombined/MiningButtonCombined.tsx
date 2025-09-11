import { useCallback } from 'react';
import { ButtonWrapper } from './styles.ts';
import { AnimatePresence } from 'motion/react';
import LoadingButton from './LoadingButton/LoadingButton.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';
import { startMining, stopMining } from '@app/store/actions/miningStoreActions.ts';
import type { ReactElement } from 'react';
import MiningButton from './MiningButton/MiningButton.tsx';
import StopIcon from './icons/StopIcon.tsx';
import PlayIcon from './icons/PlayIcon.tsx';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';

export default function MiningButtonCombined() {
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const cpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isCpuMiningModuleInitialized);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const changingModes = useMiningStore((s) => s.isChangingMode);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMining = isCPUMining || isGPUMining;
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useConfigMiningStore((s) => s.gpu_mining_enabled);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const isMiningUnlocked = gpuMiningModuleInitialized || cpuMiningModuleInitialized;
    const isMiningButtonDisabled =
        isMiningLoading || !isMiningControlsEnabled || !isMiningEnabled || !isMiningUnlocked || changingModes;
    const isAppLoading = isMiningLoading;

    const handleStartMining = useCallback(async () => {
        await startMining();
    }, []);

    const handleStopMining = useCallback(async () => {
        await stopMining();
    }, []);

    let button: ReactElement | null;

    if (isAppLoading) {
        button = <LoadingButton key="loading" />;
    } else if (isMining) {
        button = (
            <MiningButton
                key="stop"
                buttonText="stop-mining"
                onClick={handleStopMining}
                disabled={isMiningButtonDisabled}
                icon={<StopIcon />}
                isMining={isMining}
            />
        );
    } else {
        button = (
            <MiningButton
                key="start"
                buttonText="start-mining"
                onClick={handleStartMining}
                disabled={isMiningButtonDisabled}
                icon={<PlayIcon />}
                isMining={isMining}
            />
        );
    }

    return (
        <ButtonWrapper>
            <AnimatePresence mode="popLayout">{button}</AnimatePresence>
        </ButtonWrapper>
    );
}
