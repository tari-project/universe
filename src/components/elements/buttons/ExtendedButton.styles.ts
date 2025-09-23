import styled, { css } from 'styled-components';
import { ExtendedButtonStyleProps } from '@app/components/elements/buttons/button.types.ts';

const PADDING = '1rem';

export const StyledTextButton = styled.button<ExtendedButtonStyleProps>`
    ${({ theme, $color, $colorIntensity, $size }) => {
        return css`
            display: flex;
            width: fit-content;
            align-items: center;
            justify-content: center;
            color: ${theme.colors[$color ?? 'grey']?.[$colorIntensity ?? (theme.mode == 'dark' ? 200 : 600)]};
            font-size: ${$size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize};
            padding: ${$size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`};
            opacity: 1;
            &:hover {
                opacity: 0.7;
            }
            &:focus-visible {
                outline: none;
                border-bottom: 2px solid ${({ theme }) => theme.palette.focusOutline};
            }
        `;
    }}}
}`;
