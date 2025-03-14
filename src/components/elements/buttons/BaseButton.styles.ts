import styled, { css } from 'styled-components';

import { ButtonStyleProps, IconPosition } from './button.types.ts';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const StyledButton = styled.button<ButtonStyleProps>`
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    letter-spacing: ${({ theme }) => theme.typography.h6.letterSpacing};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonBase};
    background-color: ${({ theme }) => theme.palette.background.paper};
    white-space: pre;
    padding: 0 25px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    display: flex;
    position: relative;
    font-size: inherit;
    transition: all 0.25s ease-in-out;
    -webkit-user-select: none;
    &:active {
        opacity: 0.8;
    }
    &:disabled {
        opacity: 0.5;
        pointer-events: none;
        cursor: inherit;
    }

    ${({ $variant, $color, $disableColour, theme }) => {
        switch ($variant) {
            case 'outlined':
                return css`
                    color: ${theme.palette.text.primary};
                    background-color: ${theme.palette.text.contrast};
                    border: 1px solid ${theme.palette.primary.accent};
                `;
            case 'gradient':
                return css`
                    background-image: linear-gradient(86deg, #780eff -4.33%, #bf28ff 102.27%);
                    color: ${theme.palette.text.contrast};
                    &:hover:not(:disabled) {
                        background-image: linear-gradient(86deg, #780eff -24.33%, #bf28ff 78.27%);
                    }
                `;
            case 'secondary':
                return css`
                    box-shadow: 0 2px 20px -8px ${theme.palette.contrastAlpha};
                    background-color: ${theme.palette.background.paper};
                    color: ${theme.palette.action.text.main};
                    &:hover:not(:disabled) {
                        background-color: ${theme.palette.action.hover.accent};
                        box-shadow: none;
                    }
                `;
            case 'primary':
            default:
                return css`
                    color: ${$color
                        ? theme?.colors[$color ?? 'primary']?.[theme.mode == 'dark' ? 200 : 600]
                        : convertHexToRGBA(theme.palette.contrast, 0.7)};
                    background-color: ${$disableColour ? 'transparent' : theme.palette.action.background.default};
                    &:hover:not(:disabled) {
                        background-color: ${$disableColour
                            ? theme.palette.action.hover.accent
                            : theme.palette.action.hover.default};
                    }
                `;
        }
    }}

    ${({ $size, $fluid }) => {
        switch ($size) {
            case 'xs':
                return css`
                    padding: 0 8px;
                    font-size: 10px;
                `;
            case 'small':
                return css`
                    padding: 6px 12px;
                    font-size: 14px;
                `;
            case 'large':
                return css`
                    height: 50px;
                    width: ${$fluid ? '100%' : '190px'};
                `;
            case 'medium':
            default:
                return css`
                    height: 40px;
                    width: ${$fluid ? '100%' : 'min-content'};
                `;
        }
    }}
`;

const PADDING = '1rem';
export const ChildrenWrapper = styled.div<{ $iconPosition?: IconPosition }>`
    display: flex;
    position: relative;
    margin: 0 ${({ $iconPosition }) => ($iconPosition ? '1.5rem' : 0)};
`;
export const IconWrapper = styled.div<{ $position?: IconPosition; $isLoader?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;

    ${({ $isLoader }) =>
        $isLoader &&
        css`
            height: 30px;
            width: 30px;
        `}

    ${({ $position }) => {
        switch ($position) {
            case 'start': {
                return css`
                    left: ${PADDING};
                `;
            }
            case 'hug': {
                return css`
                    position: relative;
                `;
            }
            case 'end':
            default: {
                return css`
                    right: ${PADDING};
                `;
            }
        }
    }}
    svg {
        max-width: 100%;
        max-height: 100%;
    }
`;
