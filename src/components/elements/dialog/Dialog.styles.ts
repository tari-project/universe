import styled, { css } from 'styled-components';
import { FloatingOverlay } from '@floating-ui/react';
import { convertHexToRGBA } from '@app/utils';
import { ContentWrapperStyleProps } from './types.ts';

export const Overlay = styled(FloatingOverlay)`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.colorsAlpha.darkAlpha[40]};
    z-index: 10;
    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        -webkit-filter: blur(0.04em);
        filter: blur(0.04em);
        z-index: -1;
    }
`;

export const ContentWrapper = styled.div<ContentWrapperStyleProps>`
    border-radius: ${({ theme }) => theme.shape.borderRadius.dialog};
    padding: ${({ $unPadded }) => ($unPadded ? 0 : '20px')};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    flex-direction: column;
    position: relative;
    overflow-y: auto;
    max-height: 90%;
    display: flex;
    gap: 6px;

    ${({ theme, $variant }) => {
        switch ($variant) {
            case 'transparent': {
                return css`
                    background-color: ${convertHexToRGBA(
                        theme.palette.background.paper,
                        theme.mode == 'dark' ? 0.75 : 0.65
                    )};

                    &::before {
                        content: '';
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                        -webkit-backdrop-filter: blur(20px);
                        backdrop-filter: blur(20px);
                        z-index: -1;
                    }
                `;
            }
            case 'primary':
            default:
                return css`
                    background-color: ${theme.palette.background.paper};
                `;
        }
    }}
`;
