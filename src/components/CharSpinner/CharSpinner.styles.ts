import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import { CharSpinnerVariant } from '@app/components/CharSpinner/CharSpinner.tsx';

interface Props {
    $decimal?: boolean;
    $letterHeight?: number;
    $letterWidth?: number;
    $fontSize?: number;
    $variant?: CharSpinnerVariant;
}

export const Wrapper = styled('div')<{ $letterHeight?: number }>`
    display: flex;
    overflow: hidden;
    flex-direction: row;
    align-items: baseline;
    gap: 4px;
    span {
        display: flex;
        font-weight: 600;
        letter-spacing: -1px;
    }
`;

export const SpinnerWrapper = styled('div')<Props>`
    font-variant-numeric: tabular-nums;
    column-gap: ${({ $variant }) => ($variant == 'simple' ? '0' : '2px')};
    display: flex;
`;

export const CharacterWrapper = styled(motion.div)<Props>`
    display: flex;
    justify-content: center;
    overflow: hidden;
    position: relative;
    user-select: none;
    font-variant-numeric: tabular-nums;
`;

export const Characters = styled(motion.div)<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    letter-spacing: -3px;
    font-family: ${({ $variant }) =>
        $variant == 'simple' ? '"PoppinsSemiBold", sans-serif' : `"DrukWideLCGBold", sans-serif`};
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const Character = styled('div')<Props>`
    display: flex;
    justify-self: center;
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    letter-spacing: -0.05ch;
`;
