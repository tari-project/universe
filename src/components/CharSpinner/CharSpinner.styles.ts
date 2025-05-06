import * as m from 'motion/react-m';
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

export const Wrapper = styled.div<{ $variant?: Props['$variant']; $alignment?: string }>`
    width: 100%;
    display: flex;
    overflow: hidden;
    flex-direction: row;
    align-items: ${({ $alignment }) => $alignment};
    font-family: ${({ $variant }) => ($variant == 'simple' ? 'Poppins' : 'DrukWide')}, sans-serif;
`;

export const XTMWrapper = styled.span`
    display: flex;
    font-weight: 600;
    letter-spacing: -1px;
`;

export const SpinnerWrapper = styled(m.div)<Props>`
    column-gap: ${({ $variant }) => ($variant == 'simple' ? '0' : '2px')};
    display: flex;
    margin: 0 4px 0 0;
`;

export const CharacterWrapper = styled(m.div)<Props>`
    display: flex;
    justify-content: center;
    overflow: hidden;
    position: relative;
    user-select: none;
`;

export const Characters = styled(m.div)<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: ${({ $variant }) => ($variant == 'simple' ? 600 : 900)};
    font-family: ${({ $variant }) => ($variant == 'simple' ? 'Poppins' : 'DrukWide')}, sans-serif;
    font-size: ${({ $fontSize }) => `${$fontSize}px`};
    line-height: ${({ $letterHeight }) => `${$letterHeight}px`};
`;

export const Character = styled(m.div)<Props>`
    display: flex;
    text-transform: lowercase;
    position: relative;
    letter-spacing: -0.08em;
    width: min-content;
    padding: 0 0.01em 0 0;
    z-index: 1;

    // for the unit & decimal

    ${({ $decimal, $variant }) =>
        $decimal &&
        css`
            width: ${$variant == 'simple' ? `min-content` : 'auto'};
            margin: 0 1px 0 2px;
        `}
    ${({ $unit, $fontSize }) =>
        $unit &&
        css`
            margin: 3px 0 0 2px;
            font-size: ${$fontSize}px;
            letter-spacing: 0.02em;
        `}
`;
