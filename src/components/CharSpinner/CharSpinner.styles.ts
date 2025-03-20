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
    padding: 0 4px 0 0;
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
    letter-spacing: -0.2rem;
    width: max-content;
    z-index: 1;

    // for the unit & decimal

    ${({ $decimal, $variant }) =>
        $decimal &&
        css`
            width: ${$variant == 'simple' ? `4px` : 'auto'};
            margin: 0 2px;
        `}
    ${({ $unit, $fontSize }) =>
        $unit &&
        css`
            margin-top: 3px;
            font-size: ${$fontSize}px;
            letter-spacing: 1px;
        `}
`;
