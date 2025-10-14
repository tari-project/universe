import styled, { css } from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
import { convertHexToRGBA } from '@app/utils';
import { ContentWrapperStyleProps } from './types.ts';
import { m } from 'motion/react';

export const DIALOG_Z_INDEX = 99;
export const Overlay = styled(FloatingOverlay)`
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${DIALOG_Z_INDEX};
`;

export const ContentWrapper = styled.div<ContentWrapperStyleProps>`
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.35);
    border-radius: clamp(20px, 5vh, 35px);
    overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    max-height: 90%;
    display: flex;

    ${({ theme, $variant }) => {
        switch ($variant) {
            case 'transparent': {
                return css`
                    background-color: ${convertHexToRGBA(
                        theme.palette.background.paper,
                        theme.mode == 'dark' ? 0.75 : 0.6
                    )};
                    -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
                `;
            }
            case 'primary':
            default:
                return css`
                    background-color: ${theme.palette.background.paper};
                `;
        }
    }};
`;

export const Vignette = styled(m.div)`
    position: absolute;
    inset: 0;
    z-index: 2;
    background: radial-gradient(120% 120% at 50% 55%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 110%);
    pointer-events: none;
`;

export const ContentScrollContainer = styled.div<ContentWrapperStyleProps>`
    overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    position: relative;
    display: flex;
    width: 100%;
`;

export const Content = styled.div<ContentWrapperStyleProps>`
    padding: min(3vh, 20px);
    flex-direction: column;
    overflow-y: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'auto')};
    overflow-x: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;

    ${({ $unPadded }) =>
        $unPadded &&
        css`
            padding: 0;
        `};
`;

export const CloseButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    width: 100%;
`;

export const WrapperContent = styled.div`
    display: flex;
    position: relative;
`;
