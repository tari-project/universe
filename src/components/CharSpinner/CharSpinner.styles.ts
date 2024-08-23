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
    align-items: flex-start;
    height: ${({ $letterHeight }) => `${$letterHeight}px`};
    margin: ${({ $decimal }) => ($decimal ? '0 0 0 -2px' : 0)};
    font-family: ${({ $variant }) =>
        $variant == 'simple' ? '"PoppinsSemiBold", sans-serif' : `"DrukWideLCGBold", sans-serif`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
`;

export const Character = styled('div')<Props>`
    display: flex;
    font-variant-numeric: tabular-nums;
    width: ${({ $decimal, $letterWidth, $notNum }) =>
        $decimal ? '12px' : `${$notNum ? $letterWidth + 30 : $letterWidth}px`};
`;

export const HiddenNumberSpacer = styled('div')`
    font-variant-numeric: tabular-nums;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    display: flex;
`;
