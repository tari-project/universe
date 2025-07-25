import styled, { css } from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
import { colorsAll } from '@app/theme/palettes/colors.ts';
import { convertHexToRGBA } from '@app/utils';

export interface ContentWrapperProps {
    $unPadded?: boolean;
    $disableOverflow?: boolean;
    $borderRadius?: string;
    $transparentBg?: boolean;
}
export const ContentWrapper = styled.div<ContentWrapperProps>`
    border-radius: ${({ theme, $borderRadius }) => $borderRadius || theme.shape.borderRadius.dialog};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 90%;
    padding: ${({ $unPadded }) => ($unPadded ? '0' : '20px')};
    position: relative;

    ${({ theme, $transparentBg }) =>
        $transparentBg
            ? css`
                  background-color: ${convertHexToRGBA(
                      theme.palette.background.paper,
                      theme.mode == 'dark' ? 0.75 : 0.65
                  )};
                  &::before {
                      content: '';
                      position: absolute;
                      width: 100%;
                      height: 100%;
                      -webkit-backdrop-filter: blur(20px);
                      backdrop-filter: blur(20px);
                      z-index: -1;
                  }
              `
            : css`
                  background-color: ${theme.palette.background.paper};
              `}

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
