import { useCallback, useMemo } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon, ButtonWrapper } from './MiningButton.styles.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline, IoWarningOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

enum MiningButtonStateText {
    STARTED = 'pause-mining',
    START = 'start-mining',
}

function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));

    const isMining = isCPUMining || isGPUMining;

    const miningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);
    const isConnectionLostDuringMining = useMiningStore((s) => s.isConnectionLostDuringMining);
    const handleMining = useMiningControls();

    const miningLoading = miningInitiated && !isMining;

    const miningButtonStateText = useMemo(() => {
        return isMining ? MiningButtonStateText.STARTED : MiningButtonStateText.START;
    }, [isMining]);

    const handleClick = useCallback(async () => {
        if (!isMining) {
            setMiningInitiated(true);
            await handleMining('start');
            return;
        } else {
            handleMining('stop').then((r) => {
                if (r) {
                    setMiningInitiated(false);
                }
            });
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

            {isConnectionLostDuringMining && (
                <Stack direction="row">
                    <IoWarningOutline size={32} />
                    <Typography variant="p">{t('connection-to-node-lost')}</Typography>
                </Stack>
            )}
        </Stack>
    );
}

export default MiningButton;
