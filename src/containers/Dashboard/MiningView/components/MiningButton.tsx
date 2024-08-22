import { useCallback } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon } from './MiningButton.styles.ts';
import { ButtonProps } from '@mui/material';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';

function MiningButton() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isAutoMining = useAppStatusStore(useShallow((s) => s.auto_mining));
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;

    const { startMining, stopMining, getMiningButtonStateText, isWaitingForHashRate } = useMiningControls();

    const handleClick = useCallback(() => {
        if (isMining) {
            return stopMining();
        }
        if (!isMining) {
            return startMining();
        }
    }, [isMining, startMining, stopMining]);

    const btnProps: ButtonProps = {
        variant: 'contained',
        color: 'primary',
        size: 'large',
        endIcon: isMining ? <GiPauseButton /> : <IoChevronForwardOutline />,
    };

    return (
        <StyledButton
            {...btnProps}
            hasStarted={!!isMining}
            onClick={handleClick}
            disabled={!miningAllowed || isAutoMining || isWaitingForHashRate}
            endIcon={<IconWrapper>{isWaitingForHashRate ? <StyledIcon /> : btnProps.endIcon}</IconWrapper>}
            sx={{
                '& .MuiButton-endIcon': {
                    position: 'absolute',
                    right: '1rem',
                },
            }}
        >
            <span>{getMiningButtonStateText()}</span>
        </StyledButton>
    );
}

export default MiningButton;
