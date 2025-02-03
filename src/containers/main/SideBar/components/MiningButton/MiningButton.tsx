import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAppStateStore } from '@app/store/appStateStore.ts';

import LoadingSvg from '@app/components/svgs/LoadingSvg.tsx';
import ButtonOrbitAnimation from '../../Miner/components/ButtonOrbitAnimation.tsx';
import { IconWrapper, StyledButton, ButtonWrapper } from './MiningButton.styles.ts';
import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { startMining, stopMining } from '@app/store/miningStoreActions.ts';

enum MiningButtonStateText {
    STARTED = 'stop-mining',
    START = 'start-mining',
}

export default function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isAppSettingUp = useAppStateStore((s) => !s.setupComplete);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu.mining.is_mining);
    const isMining = isCPUMining || isGPUMining;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const isMiningButtonDisabled = isAppSettingUp || isMiningLoading || !isMiningControlsEnabled;
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
