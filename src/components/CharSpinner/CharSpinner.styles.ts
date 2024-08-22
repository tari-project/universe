import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import { CharSpinnerVariant } from '@app/components/CharSpinner/CharSpinner.tsx';

export const Wrapper = styled('div')<{ $letterHeight?: number }>`
    position: relative;
    overflow: hidden;
    user-select: none;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-shrink: 0;
    height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const Characters = styled(motion.div)`
    display: flex;
    position: absolute;
    z-index: 1;
`;
export const Character = styled(motion.div)<{
    $letterHeight?: number;
    $fontSize?: number;
    $variant?: CharSpinnerVariant;
}>`
    display: flex;
    height: ${({ $letterHeight }) => `${$letterHeight}px`};
    flex-direction: column;
    align-items: center;

    span {
        display: flex;
        font-family: ${({ $variant }) =>
            $variant == 'simple' ? '"PoppinsSemiBold", sans-serif' : `"DrukWideLCGBold", sans-serif`};
        font-size: ${({ $fontSize }) => `${$fontSize}px`};
        line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
    }
`;
