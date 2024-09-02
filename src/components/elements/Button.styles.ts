import styled, { css } from 'styled-components';
import { ButtonProps } from '@app/components/elements/Button.tsx';
// import buttonBg from '@app/assets/backgrounds/button-bg.png';
import soon from '@app/assets/images/tiny-soon.png';

const PADDING = '1rem';

interface Props {
    $variant?: ButtonProps['variant'];
    $outlined?: boolean;
    $simple?: boolean;
}

const ROUNDED_BASE_STYLES = css`
    height: 55px;
    border-radius: ${({ theme }) => theme.shape.borderRadius.button};
    box-shadow:
            0 0 10px 0 ${({ theme }) => theme.palette.primary.shadow};,
0 0 13px 0 rgba(255, 255, 255, 0.55) inset;
`;

const SQUARED_BASE_STYLES = css`
    height: 36px;
    border: 1px solid ${({ theme }) => theme.palette.primary.light};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonSquared};
`;

const BASE_STYLES = css`
    cursor: pointer;
    display: inline-flex;
    transition: all 0.2s ease-in-out;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 10px ${PADDING};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
    letter-spacing: ${({ theme }) => theme.typography.h6.letterSpacing};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};

    &:active {
        opacity: 0.9;
    }
    &:disabled {
        opacity: 0.5;
        cursor: url(${soon}), wait;
    }
`;

export const BaseButton = styled.button<Props>`
    background: ${({ theme, $outlined }) => ($outlined ? theme.palette.background.paper : theme.palette.primary.main)};
    color: ${({ theme, $outlined }) => ($outlined ? theme.palette.primary.main : theme.palette.text.contrast)};
    &:hover {
        background: ${({ theme, $outlined }) => ($outlined ? theme.palette.primary.wisp : theme.palette.primary.dark)};
    }
    ${BASE_STYLES}

    ${({ $variant, $simple, theme }) => {
        switch ($variant) {
            case 'text':
                return css`
                    background: ${theme.palette.background.paper};
                    color: ${theme.palette.primary.main};
                    height: unset;
                    padding: ${$simple ? '0 4px' : `10px ${PADDING}`};
                    &:hover {
                        background: ${$simple ? 'none' : theme.palette.primary.wisp};
                        color: ${$simple ? theme.palette.primary.dark : theme.palette.primary.main};
                        border-radius: ${theme.shape.borderRadius.buttonSquared};
                    }
                `;
            case 'rounded':
                return ROUNDED_BASE_STYLES;
            case 'squared':
            default:
                return SQUARED_BASE_STYLES;
        }
    }}

}`;

export const ChildrenWrapper = styled.div`
    display: flex;
`;
export const IconWrapper = styled.div<{ $position?: ButtonProps['iconPosition'] }>`
    display: flex;
    position: absolute;
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

export const BaseIconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    border-radius: 100%;
    transition: background-color 0.2s ease-in-out;
    &:hover {
        background-color: ${({ theme }) => theme.palette.primary.wisp};
    }
`;
