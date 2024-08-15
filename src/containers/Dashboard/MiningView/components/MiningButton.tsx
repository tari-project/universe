import { IoChevronForwardCircle, IoPauseCircle } from 'react-icons/io5';
import { useMining } from '../../../../hooks/useMining.ts';
import { useCallback, useEffect, useState } from 'react';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';
import { StyledButton, StyledIcon } from '../MiningButton.styles.ts';
import { ButtonProps } from '@mui/material';
import { useUIStore } from '../../../../store/useUIStore.ts';
import useAppStateStore from '../../../../store/appStateStore.ts';

function MiningButton() {
    const [buttonLoading, setButtonLoading] = useState(false);
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);
    const miningInitiated = useUIStore((s) => s.miningInitiated);
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;

    const { startMining, stopMining, hasMiningBeenStopped } = useMining();

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
        endIcon: isMining ? <IoPauseCircle /> : <IoChevronForwardCircle />,
    };

    const actionText = !isMining
        ? hasMiningBeenStopped
            ? 'Resume'
            : 'Start'
        : 'Stop';

    return (
        <StyledButton
            {...btnProps}
            hasStarted={!!isMining}
            onClick={handleClick}
            disabled={!miningAllowed}
            endIcon={buttonLoading ? <StyledIcon /> : btnProps.endIcon}
        >
            <span style={{ flexGrow: 1 }}>{`${actionText} mining`}</span>
        </StyledButton>
    );
}

export default MiningButton;
