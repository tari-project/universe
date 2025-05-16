import styled, { css } from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
import { colorsAll } from '@app/theme/palettes/colors.ts';

export const ContentWrapper = styled.div<{ $unPadded?: boolean; $disableOverflow?: boolean; $borderRadius?: string }>`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme, $borderRadius }) => $borderRadius || theme.shape.borderRadius.dialog};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 90%;
    padding: ${({ $unPadded }) => ($unPadded ? '0' : '20px')};

    ${({ $disableOverflow }) =>
        !$disableOverflow &&
        css`
            overflow-y: auto;
        `}
`;

export const Overlay = styled(FloatingOverlay)`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${colorsAll.darkAlpha[50]};
    z-index: 100;
`;
