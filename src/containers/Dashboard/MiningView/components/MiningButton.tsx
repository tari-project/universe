import { Button } from '@mui/material';
import { IoChevronForwardCircle, IoPauseCircle } from 'react-icons/io5';
import { AiOutlineLoading } from 'react-icons/ai';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';
import { useMining } from '../../../../hooks/useMining.ts';
import { styled } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import { useUIStore } from '../../../../store/useUIStore.ts';

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
    const isMining = useAppStatusStore((s) => s.cpu?.is_mining);
    const hashRate = useAppStatusStore((s) => s.cpu?.hash_rate);
    const isHashRatePresent = hashRate !== undefined && hashRate > 0;
    console.log('hashRate', hashRate);
    const isLoading = useUIStore((s) => s.isMiningLoading);

    const { startMining, stopMining } = useMining();

    const handleMining = () => {
        if (isLoading) return;
        if (isMining && isHashRatePresent) {
            stopMining();
        } else {
            startMining();
        }
    };

    const buttonStyle = isMining && isHashRatePresent ? StopStyle : StartStyle;
    const buttonIcon =
        isMining && isHashRatePresent ? (
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
                isLoading ? { ...buttonStyle, ...LoadingStyle } : buttonStyle
            }
            onClick={() => handleMining()}
            endIcon={isLoading ? <StyledIcon /> : buttonIcon}
            sx={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <span style={{ flexGrow: 1 }}>
                {isMining && isHashRatePresent ? 'Stop Mining' : 'Start Mining'}
            </span>
        </StyledButton>
    );
}

export default MiningButton;
