import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import { CharSpinnerVariant } from '@app/components/CharSpinner/CharSpinner.tsx';

interface Props {
    $decimal?: boolean;
    $notNum?: boolean;
    $letterHeight?: number;
    $letterWidth: number;
    $fontSize?: number;
    $variant?: CharSpinnerVariant;
    $offSet?: number;
}

export const Wrapper = styled('div')<{ $letterHeight?: number }>`
    position: relative;
    display: flex;
    align-items: baseline;
    height: ${({ $letterHeight }) => `${$letterHeight}px`};

    span {
        display: flex;
        font-weight: 600;
        letter-spacing: -1px;
    }
`;

export const SpinnerWrapper = styled('div')`
    display: flex;
    position: relative;
    overflow: hidden;
    user-select: none;
    font-variant-numeric: tabular-nums;
`;

export const CharacterWrapper = styled(motion.div)`
    display: flex;
    position: absolute;
    z-index: 1;
`;

export const Characters = styled(motion.div)<Props>`
    display: flex;
    flex-direction: column;
    font-family: ${({ $variant }) =>
        $variant == 'simple' ? '"PoppinsSemiBold", sans-serif' : `"DrukWideLCGBold", sans-serif`};
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    height: ${({ $letterHeight }) => `${$letterHeight}px`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const Character = styled('div')<Props>`
    display: flex;
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    width: ${({ $decimal, $letterWidth }) => ($decimal ? '14px' : `${$letterWidth}px`)};
`;

export const HiddenNumberSpacer = styled('div')<{ $fontSize?: number }>`
    pointer-events: none;
    visibility: hidden;
    display: flex;
    opacity: 0;
    z-index: 0;
`;
