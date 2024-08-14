import { Button } from '@mui/material';
import { IoChevronForwardCircle, IoPauseCircle } from 'react-icons/io5';
import { AiOutlineLoading } from 'react-icons/ai';
import { useMining } from '../../../../hooks/useMining.ts';
import { styled } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import { useVisualisation } from '../../../../hooks/useVisualisation.ts';
import { useCallback } from 'react';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';

const selectButtonText = (isMining: boolean, hasMiningBeenStopped: boolean) => {
    if (hasMiningBeenStopped) return 'Resume Mining';
    if (isMining) return 'Stop Mining';
    if (!isMining) return 'Start Mining';
};

const StartStyle = {
    background: '#06C983',
    border: '1px solid #06C983',
    '&:hover': {
        background: '#ff0000',
    },
};

const StopStyle = {
    background: '#000000',
    border: '1px solid #000000',
};

const LoadingStyle = {
    opacity: 0.7,
    pointerEvents: 'none',
};

const StyledButton = styled(Button)(() => ({
    padding: '10px 18px',
    borderRadius: '30px',
}));

const spin = keyframes`
  from {
  transform:rotate(0deg)
  }
  to {
  transform:rotate(360deg)
  }
`;
const StyledIcon = styled(AiOutlineLoading)(() => ({
    animation: `${spin} 1s infinite`,
    animationTimingFunction: 'cubic-bezier(0.76, 0.89, 0.95, 0.85)',
}));

function MiningButton() {
    const { handleStart, handlePause } = useVisualisation();
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);

    const {
        startMining,
        stopMining,
        shouldDisplayLoading,
        hasMiningBeenStopped,
    } = useMining();

    const handleStartMining = useCallback(() => {
        if (shouldDisplayLoading) return;
        startMining().then(() => handleStart(hasMiningBeenStopped));
    }, [shouldDisplayLoading, startMining, handleStart, hasMiningBeenStopped]);

    const handleStopMining = useCallback(() => {
        if (shouldDisplayLoading) return;
        stopMining().then(() => handlePause());
    }, [shouldDisplayLoading, stopMining, handlePause]);

    const buttonStyle = isMining ? StopStyle : StartStyle;
    const buttonIcon = isMining ? (
        <IoPauseCircle />
    ) : (
        <IoChevronForwardCircle />
    );

    return (
        <StyledButton
            variant="contained"
            color="primary"
            size="large"
            style={
                shouldDisplayLoading
                    ? { ...buttonStyle, ...LoadingStyle }
                    : buttonStyle
            }
            onClick={isMining ? handleStopMining : handleStartMining}
            endIcon={shouldDisplayLoading ? <StyledIcon /> : buttonIcon}
            sx={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <span style={{ flexGrow: 1 }}>
                {selectButtonText(Boolean(isMining), hasMiningBeenStopped)}
            </span>
        </StyledButton>
    );
}

export default MiningButton;
