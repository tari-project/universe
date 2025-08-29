import styled, { css } from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
import { convertHexToRGBA } from '@app/utils';
import { ContentWrapperStyleProps } from './types.ts';

export const Overlay = styled(FloatingOverlay)`
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
`;

export const ContentWrapper = styled.div<ContentWrapperStyleProps>`
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    border-radius: clamp(20px, 3.5vh, 35px);
    overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    max-height: 90%;
    display: flex;

    ${({ theme, $variant }) => {
        switch ($variant) {
            case 'transparent': {
                return css`
                    background-color: ${convertHexToRGBA(
                        theme.palette.background.paper,
                        theme.mode == 'dark' ? 0.75 : 0.65
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
export const ContentScrollContainer = styled.div<ContentWrapperStyleProps>`
    overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    position: relative;
    display: flex;
`;

export const Content = styled.div<ContentWrapperStyleProps>`
    padding: ${({ $unPadded }) => ($unPadded ? 0 : '20px')};
    flex-direction: column;
    overflow-y: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'auto')};
    overflow-x: ${({ $allowOverflow }) => ($allowOverflow ? 'unset' : 'hidden')};
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
`;
