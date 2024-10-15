import styled, { css } from 'styled-components';
import { ButtonStyleProps, IconPosition } from '@app/components/elements/buttons/button.types.ts';

const PADDING = '1rem';

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

export const BaseButton = styled.button<ButtonStyleProps>`
    border-color: ${({ theme, $color }) => theme.palette[$color || 'primary'].light};
    background: ${({ theme, $color }) => theme.palette[$color || 'primary'].main};
    color: ${({ theme, $color }) => theme.palette[$color || 'primary'].contrast};
    font-size: ${({ theme, $size }) => ($size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize)};
    padding:  ${({ $size }) => ($size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`)};

    &:hover {
        background: ${({ theme, $color }) => theme.palette[$color || 'primary'].dark};
    }
    ${BASE_STYLES}
    ${SQUARED_BASE_STYLES}
}`;

export const ChildrenWrapper = styled.div`
    display: flex;
    user-select: none;
    -webkit-user-select: none;
    position: relative;
`;
export const IconWrapper = styled.div<{ $position?: IconPosition }>`
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

export const StyledTextButton = styled.button<ButtonStyleProps>`
    ${BASE_STYLES}
    ${({ theme, $color, $size }) => {
        return css`
            background: ${theme.palette.background.paper};
            color: ${theme.palette[$color || 'primary'].main};
            font-size: ${$size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize};
            padding: ${$size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`};
            &:hover {
                background: ${theme.palette[$color || 'primary'].wisp};
                color: ${theme.palette[$color || 'primary'].dark};
                border-radius: ${theme.shape.borderRadius.buttonSquared};
            }
        `;
    }}}
}`;
