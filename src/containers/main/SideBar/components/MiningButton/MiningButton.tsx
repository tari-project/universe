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
import { startMining, stopMining } from '@app/store/actions/miningStoreActions.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { setAnimationState, animationStatus } from '@tari-project/tari-tower';

enum MiningButtonStateText {
    STARTED = 'stop-mining',
    START = 'start-mining',
}

export default function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isAppSettingUp = useAppStateStore((s) => !s.setupComplete);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isMining = isCPUMining || isGPUMining;
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isMiningEnabled = isCpuMiningEnabled || isGpuMiningEnabled;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const isMiningButtonDisabled = isAppSettingUp || isMiningLoading || !isMiningControlsEnabled || !isMiningEnabled;
    const isAppLoading = isAppSettingUp || isMiningLoading;

    const miningButtonStateText = useMemo(() => {
        return isMining && isMiningInitiated ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining, isMiningInitiated]);

    const forceAnimationStop = useCallback(() => {
        let retryCount = 0;
        const maxRetries = 10;

        const attemptStop = () => {
            if (animationStatus === 'not-started') {
                console.debug('MiningButton', `Animation stopped: status=${animationStatus}`);
                return;
            }

            if (retryCount >= maxRetries) {
                console.debug(
                    'MiningButton',
                    `Animation Stop failed after ${maxRetries} retries: status=${animationStatus}`
                );
                return;
            }

            console.debug(
                'MiningButton',
                `Animation stop attempt ${retryCount + 1}/${maxRetries}: status=${animationStatus}`
            );
            setAnimationState('stop');
            retryCount++;

            setTimeout(() => {
                attemptStop();
            }, 1000);
        };

        attemptStop();
    }, []);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            await startMining();
            setAnimationState('start');
        } else {
            await stopMining();
            forceAnimationStop();
        }
    }, [isMining, forceAnimationStop]);

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
