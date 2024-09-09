import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon, ButtonWrapper } from './MiningButton.styles.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

import { IoChevronForwardOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

enum MiningButtonStateText {
    STARTED = 'pause-mining',
    START = 'start-mining',
}

export default function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const miningControlsEnabled = useMiningStore(useShallow((s) => s.miningControlsEnabled));
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const setMiningInitiated = useMiningStore(useShallow((s) => s.setMiningInitiated));

    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));

    const isMining = isCPUMining || isGPUMining;

    const { handleStop, handleStart } = useMiningControls();

    const miningLoading = (isMining && !miningInitiated) || (miningInitiated && !isMining);

    const miningButtonStateText = useMemo(() => {
        return isMining ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining]);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            setMiningInitiated(true);
            return await handleStart();
        } else {
            setMiningInitiated(false);
            return await handleStop();
        }
    }, [handleStart, handleStop, isMining, setMiningInitiated]);

    const icon = isMining ? <GiPauseButton /> : <IoChevronForwardOutline />;

    return (
        <ButtonWrapper layout layoutId="mining-button-wrapper">
            <StyledButton
                variant="rounded"
                $hasStarted={isMining}
                onClick={handleClick}
                icon={<IconWrapper>{miningLoading ? <StyledIcon /> : icon}</IconWrapper>}
                disabled={!miningControlsEnabled || miningLoading}
            >
                <span>{t(`mining-button-text.${miningButtonStateText}`)}</span>
            </StyledButton>
        </ButtonWrapper>
    );
}
