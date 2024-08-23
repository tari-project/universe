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
    overflow-y: hidden;
    user-select: none;
    font-variant-numeric: tabular-nums;
    display: flex;
    height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const CharacterWrapper = styled(motion.div)`
    display: flex;
    position: absolute;
    z-index: 1;
`;

export const Characters = styled(motion.div)<Props>`
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    align-items: center;

    height: ${({ $letterHeight }) => `${$letterHeight}px`};
    margin: ${({ $decimal }) => ($decimal ? '0 0 0 -2px' : 0)};
    font-family: ${({ $variant }) =>
        $variant == 'simple' ? '"PoppinsSemiBold", sans-serif' : `"DrukWideLCGBold", sans-serif`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
`;

export const Character = styled('div')<Props>`
    display: flex;
    width: auto;
    max-width: ${({ $decimal, $letterWidth, $notNum, $offSet = 20 }) =>
        $decimal ? '14px' : `${$notNum ? $letterWidth + $offSet : $letterWidth}px`};
`;

export const HiddenNumberSpacer = styled('div')`
    visibility: hidden;
    opacity: 0;

    pointer-events: none;
    z-index: 0;
    display: flex;
    flex-shrink: 0;
`;
