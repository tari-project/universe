import { IoChevronForwardCircle, IoPauseCircle } from 'react-icons/io5';
import { useMining } from '../../../../hooks/useMining.ts';
import { useVisualisation } from '../../../../hooks/useVisualisation.ts';
import { useCallback, useState } from 'react';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';
import { StyledButton, StyledIcon } from '../MiningButton.styles.ts';
import { ButtonProps } from '@mui/material';

function MiningButton() {
    const [buttonLoading, setButtonLoading] = useState(false);
    const { handlePause } = useVisualisation();
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);
    const { startMining, stopMining, hasMiningBeenStopped } = useMining();

    const handleStartMining = useCallback(async () => {
        startMining().then(() => {
            setButtonLoading(false);
        });
    }, [startMining]);

    const handleStopMining = useCallback(() => {
        stopMining().then(() => {
            void handlePause();
            setButtonLoading(false);
        });
    }, [handlePause, stopMining]);

    const handleClick = useCallback(() => {
        setButtonLoading(true);
        if (isMining) {
            return handleStopMining();
        }
        if (!isMining) {
            return handleStartMining();
        }
    }, [handleStartMining, handleStopMining, isMining]);

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
            endIcon={buttonLoading ? <StyledIcon /> : btnProps.endIcon}
        >
            <span style={{ flexGrow: 1 }}>{`${actionText} mining`}</span>
        </StyledButton>
    );
}

export default MiningButton;
