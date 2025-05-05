import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { startMining, stopMining } from '@app/store/actions/miningStoreActions.ts';

import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';
import LoadingSvg from '@app/components/svgs/LoadingSvg.tsx';
import ButtonOrbitAnimation from '../Miner/components/ButtonOrbitAnimation.tsx';

import { IconWrapper, StyledButton, ButtonWrapper } from './MiningButton.styles.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '@app/store/index.ts';

enum MiningButtonStateText {
    STARTED = 'stop-mining',
    START = 'start-mining',
}

export default function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isAppSettingUp = useSetupStore((s) => !s.appUnlocked);
    const isMiningUnlocked = useSetupStore((s) => s.miningUnlocked);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);

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

    const miningButtonStateText = useMemo(() => {
        return isMining && isMiningInitiated ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining, isMiningInitiated]);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            await startMining();
        } else {
            await stopMining();
        }
    }, [isMining]);

    const icon = isMining ? <GiPauseButton /> : <IoChevronForwardOutline />;
    const iconFinal = <IconWrapper>{isMiningLoading ? <SpinnerIcon /> : icon}</IconWrapper>;

    return (
        <ButtonWrapper>
            <StyledButton
                size="large"
                $hasStarted={isMining}
                fluid
                onClick={handleClick}
                icon={!isAppLoading ? iconFinal : null}
                disabled={isMiningButtonDisabled}
                $isLoading={isAppLoading}
            >
                {!isAppLoading ? <span>{t(`mining-button-text.${miningButtonStateText}`)}</span> : <LoadingSvg />}
                {isMining ? <ButtonOrbitAnimation /> : null}
            </StyledButton>
        </ButtonWrapper>
    );
}
