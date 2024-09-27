import styled, { css } from 'styled-components';
import { ButtonProps } from '@app/components/elements/Button.tsx';

const PADDING = '1rem';

interface Props {
    $variant?: ButtonProps['variant'];
    $color?: ButtonProps['color'];
    $size?: ButtonProps['size'];
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
    border-style: solid;
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonSquared};
`;

const BASE_STYLES = css`
    cursor: pointer;
    display: inline-flex;
    transition: all 0.2s ease-in-out;
    align-items: center;
    justify-content: center;
    position: relative;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
    letter-spacing: ${({ theme }) => theme.typography.h6.letterSpacing};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
    border-width: 1px;
    white-space: nowrap;

    &:active {
        opacity: 0.9;
    }
    &:disabled {
        opacity: 0.5;
        cursor: inherit;
    }
`;

export const BaseButton = styled.button<Props>`
    border-color: ${({ theme, $color }) => theme.palette[$color || 'primary'].light};
    background: ${({ theme, $outlined }) => ($outlined ? theme.palette.background.paper : theme.palette.primary.main)};
    color: ${({ theme, $outlined, $color }) => ($outlined ? theme.palette[$color || 'primary'].main : theme.palette.text.contrast)};
    font-size: ${({ theme, $size }) => ($size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize)};
    padding:  ${({ $size }) => ($size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`)};

    &:hover {
        background: ${({ theme, $outlined, $color }) => ($outlined ? theme.palette[$color || 'primary'].wisp : theme.palette[$color || 'primary'].dark)};
    }
    ${BASE_STYLES}

    ${({ $variant, $simple, theme, $color, $size }) => {
        switch ($variant) {
            case 'text':
                return css`
                    background: ${theme.palette.background.paper};
                    color: ${theme.palette[$color || 'primary'].main};
                    height: unset;
                    padding: ${$simple
                        ? '0 4px'
                        : $size === 'small'
                          ? '4px 6px'
                          : $size === 'large'
                            ? `12px ${PADDING}`
                            : `10px ${PADDING}`};
                    &:hover {
                        background: ${$simple ? 'none' : theme.palette.primary.wisp};
                        color: ${theme.palette[$color || 'primary'].dark};
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
    user-select: none;
    -webkit-user-select: none;
    position: relative;
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

export const BaseIconButton = styled.button<Props>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    border-radius: 100%;
    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    &:hover {
        background-color: ${({ theme }) => theme.palette.primary.wisp};
    }

    ${({ $size }) =>
        $size === 'small' &&
        css`
            height: 24px;
            width: 24px;
        `}
`;
