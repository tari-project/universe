import { m } from 'framer-motion';
import { CharSpinnerVariant } from '@app/components/CharSpinner/CharSpinner.tsx';
import styled, { css } from 'styled-components';

interface Props {
    $decimal?: boolean;
    $unit?: boolean;
    $letterHeight?: number;
    $letterWidth?: number;
    $fontSize?: number;
    $variant?: CharSpinnerVariant;
}

export const Wrapper = styled.div<{ $letterHeight?: number }>`
    width: 100%;
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

export const SpinnerWrapper = styled(m.div)<Props>`
    font-variant-numeric: tabular-nums;
    column-gap: ${({ $variant }) => ($variant == 'simple' ? '0' : '2px')};
    display: flex;
`;

export const CharacterWrapper = styled(m.div)<Props>`
    display: flex;
    justify-content: center;
    overflow: hidden;
    position: relative;
    user-select: none;
    font-variant-numeric: tabular-nums;
`;

export const Characters = styled(m.div)<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: ${({ $variant }) => ($variant == 'simple' ? 600 : 700)};
    font-family: ${({ $variant }) => ($variant == 'simple' ? 'Poppins' : 'Druk')}, sans-serif;
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const Character = styled(m.div)<Props>`
    display: flex;
    justify-self: center;
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    text-transform: lowercase;
    width: min-content;
    letter-spacing: -3px;
    z-index: 1;
    // for the unit & decimal

    ${({ $decimal, $unit }) =>
        ($decimal || $unit) &&
        css`
            letter-spacing: normal;
            margin-left: 1px;
            margin-right: -1px;
        `}
`;
