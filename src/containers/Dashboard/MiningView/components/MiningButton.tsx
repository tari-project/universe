import { useCallback } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon } from './MiningButton.styles.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline, IoWarningOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

function MiningButton() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

    const {
        startMining,
        stopMining,
        getMiningButtonStateText,
        isLoading,
        shouldMiningControlsBeEnabled,
        isConnectionLostDuringMining,
        cancelMining,
    } = useMiningControls();

    const handleClick = useCallback(() => {
        if (isConnectionLostDuringMining) {
            return cancelMining();
        }

        if (isMining) {
            return stopMining();
        }
        if (!isMining) {
            return startMining();
        }
    }, [isMining, startMining, stopMining, cancelMining, isConnectionLostDuringMining]);

    const btnProps = {
        variant: 'contained',
        color: 'primary',
        size: 'large',
        endIcon: isMining ? <GiPauseButton /> : <IoChevronForwardOutline />,
    };

    return (
        <Stack>
            <StyledButton
                variant="rounded"
                $hasStarted={!!isMining || isConnectionLostDuringMining}
                onClick={handleClick}
                // disabled={!shouldMiningControlsBeEnabled}
                // endIcon={<IconWrapper>{isLoading ? <StyledIcon /> : btnProps.endIcon}</IconWrapper>}
                // sx={{
                //     '& .MuiButton-endIcon': {
                //         position: 'absolute',
                //         right: '1rem',
                //     },
                // }}
            >
                <span>{t(`mining-button-text.${getMiningButtonStateText()}`)}</span>
            </StyledButton>
            {isConnectionLostDuringMining && (
                <Stack
                // direction="row"
                // gap={1}
                // sx={{
                //     border: '1px solid #d6a463',
                //     background: '#d6a46322',
                //     color: '#d6a463',
                //     border-radius: '8px',
                //     padding: '4px 8px',
                // }}
                >
                    <IoWarningOutline size={32} />
                    <Typography variant="p">{t('connection-to-node-lost')}</Typography>
                </Stack>
            )}
        </Stack>
    );
}

export default MiningButton;
