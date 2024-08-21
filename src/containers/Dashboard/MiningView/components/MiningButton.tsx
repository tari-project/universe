import { useCallback, useEffect, useState } from 'react';
import { GiPauseButton } from 'react-icons/gi';

import { IconWrapper, StyledButton, StyledIcon } from './MiningButton.styles.ts';
import { ButtonProps } from '@mui/material';
import { useUIStore } from '@app/store/useUIStore.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { IoChevronForwardOutline } from 'react-icons/io5';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';

function MiningButton() {
    const [buttonLoading, setButtonLoading] = useState(false);
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const miningInitiated = useUIStore((s) => s.miningInitiated);
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;

    const { startMining, stopMining, hasMiningBeenStopped } = useMiningControls();

    useEffect(() => {
        const startLoad = !isMining && miningInitiated;
        if (startLoad) {
            setButtonLoading(true);
        } else {
            setButtonLoading(false);
        }
    }, [isMining, miningInitiated]);

    const handleClick = useCallback(() => {
        setButtonLoading(true);
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

    const actionText = !isMining ? (hasMiningBeenStopped ? 'Resume' : 'Start') : 'Pause';

    return (
        <StyledButton
            {...btnProps}
            hasStarted={!!isMining}
            onClick={handleClick}
            disabled={!miningAllowed}
            endIcon={<IconWrapper>{buttonLoading ? <StyledIcon /> : btnProps.endIcon}</IconWrapper>}
            sx={{
                '& .MuiButton-endIcon': {
                    position: 'absolute',
                    right: '1rem',
                },
            }}
        >
            <span>{`${actionText} mining`}</span>
        </StyledButton>
    );
}

export default MiningButton;
