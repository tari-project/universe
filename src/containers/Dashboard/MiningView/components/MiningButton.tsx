import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon, ButtonWrapper } from './MiningButton.styles.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

import { IoChevronForwardOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

enum MiningButtonStateText {
    STARTED = 'pause-mining',
    START = 'start-mining',
}

function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const miningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);

    const isCPUMining = useCPUStatusStore((s) => s.is_mining);
    const isGPUMining = useGPUStatusStore((s) => s.is_mining);

    const isMining = isCPUMining || isGPUMining;

    const handleMining = useMiningControls();

    const miningLoading = miningInitiated && !isMining;

    const miningButtonStateText = useMemo(() => {
        return isMining ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining]);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            setMiningInitiated(true);
            return await handleMining('start');
        } else {
            setMiningInitiated(false);
            return await handleMining('stop');
        }
    }, [isMining, setMiningInitiated, handleMining]);

    const icon = isMining ? <GiPauseButton /> : <IoChevronForwardOutline />;

    return (
        <Stack>
            <ButtonWrapper>
                <StyledButton
                    variant="rounded"
                    $hasStarted={isMining}
                    onClick={handleClick}
                    icon={<IconWrapper>{miningLoading ? <StyledIcon /> : icon}</IconWrapper>}
                    disabled={!miningControlsEnabled}
                >
                    <span>{t(`mining-button-text.${miningButtonStateText}`)}</span>
                </StyledButton>
            </ButtonWrapper>
        </Stack>
    );
}

export default MiningButton;
