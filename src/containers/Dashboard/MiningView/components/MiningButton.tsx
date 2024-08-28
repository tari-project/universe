import { useCallback } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon } from './MiningButton.styles.ts';
import { ButtonProps, Stack, Typography } from '@mui/material';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline, IoWarningOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';

function MiningButton() {
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

    const btnProps: ButtonProps = {
        variant: 'contained',
        color: 'primary',
        size: 'large',
        endIcon: isMining ? <GiPauseButton /> : <IoChevronForwardOutline />,
    };

    return (
        <Stack gap={1}>
            <StyledButton
                {...btnProps}
                hasStarted={!!isMining || isConnectionLostDuringMining}
                onClick={handleClick}
                disabled={!shouldMiningControlsBeEnabled}
                endIcon={<IconWrapper>{isLoading ? <StyledIcon /> : btnProps.endIcon}</IconWrapper>}
                sx={{
                    '& .MuiButton-endIcon': {
                        position: 'absolute',
                        right: '1rem',
                    },
                }}
            >
                <span>{getMiningButtonStateText()}</span>
            </StyledButton>
            {isConnectionLostDuringMining && (
                <Stack
                    direction="row"
                    gap={1}
                    sx={{
                        border: '1px solid #d6a463',
                        background: '#d6a46322',
                        color: '#d6a463',
                        borderRadius: '8px',
                        padding: '4px 8px',
                    }}
                >
                    <IoWarningOutline size={32} />
                    <Typography variant="body2" textAlign="left">
                        Connection to miner lost. Please wait for the miner to reconnect or restart the miner.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
}

export default MiningButton;
