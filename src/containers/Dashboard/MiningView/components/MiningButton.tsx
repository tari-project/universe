import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon, ButtonWrapper } from './MiningButton.styles.ts';

import { IoChevronForwardOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import ButtonOrbitAnimation from '@app/containers/SideBar/Miner/components/ButtonOrbitAnimation.tsx';
import { AnimatePresence } from 'framer-motion';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

enum MiningButtonStateText {
    STARTED = 'stop-mining',
    START = 'start-mining',
}

export default function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const startMining = useMiningStore((s) => s.startMining);
    const stopMining = useMiningStore((s) => s.stopMining);
    const isAppSettingUp = useAppStateStore((s) => s.isSettingUp);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const isGPUMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);

    const isMining = isCPUMining || isGPUMining;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const anyMiningEnabled = isCpuMiningEnabled || isGPUMiningEnabled;
    const isMiningButtonDisabled = isAppSettingUp || isMiningLoading || !isMiningControlsEnabled || !anyMiningEnabled;

    const miningButtonStateText = useMemo(() => {
        return isMining && isMiningInitiated ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining, isMiningInitiated]);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            await startMining();
        } else {
            await stopMining();
        }
    }, [isMining, startMining, stopMining]);

    const icon = isMining ? <GiPauseButton /> : <IoChevronForwardOutline />;
    return (
        <ButtonWrapper>
            <StyledButton
                variant="rounded"
                $hasStarted={isMining}
                onClick={handleClick}
                icon={<IconWrapper>{isMiningLoading ? <StyledIcon /> : icon}</IconWrapper>}
                disabled={isMiningButtonDisabled}
            >
                <span>{t(`mining-button-text.${miningButtonStateText}`)}</span>
            </StyledButton>
            <AnimatePresence>{isMining ? <ButtonOrbitAnimation /> : null}</AnimatePresence>
        </ButtonWrapper>
    );
}
