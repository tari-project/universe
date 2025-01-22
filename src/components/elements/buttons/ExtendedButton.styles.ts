import styled, { css } from 'styled-components';
import { ExtendedButtonStyleProps } from '@app/components/elements/buttons/button.types.ts';

const PADDING = '1rem';

export const ButtonSquared = styled.button<ExtendedButtonStyleProps>`
    ${({ theme, $color = 'grey', $colorIntensity, $size }) => {
        return css`
            cursor: pointer;
            display: inline-flex;
            transition: all 0.2s ease-in-out;
            align-items: center;
            justify-content: center;
            position: relative;
            font-family: ${theme.typography.fontFamily};
            line-height: ${theme.typography.h6.lineHeight};
            letter-spacing: ${theme.typography.h6.letterSpacing};
            font-weight: ${theme.typography.h6.fontWeight};
            border-width: 1px;
            white-space: nowrap;

            height: 36px;
            border-style: solid;
            border-radius: ${theme.shape.borderRadius.buttonSquared};
            border-color: ${theme.colors[$color]?.[theme.mode === 'dark' ? 950 : 100]};
            background: ${theme.colors[$color]?.[theme.mode === 'dark' ? 900 : 50]};
            color: ${theme.colors[$color]?.[$colorIntensity ?? (theme.mode === 'dark' ? 50 : 800)]};
            font-size: ${$size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize};
            padding: ${$size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`};

            &:hover {
                background: ${theme.colors[$color]?.[theme.mode === 'dark' ? 950 : 100]};
            }
            &:active {
                opacity: 0.9;
            }
            &:disabled {
                opacity: 0.5;
                pointer-events: none;
                cursor: inherit;
            }
        `;
    }}}
   
}`;

export const StyledTextButton = styled.button<ExtendedButtonStyleProps>`
    ${({ theme, $color, $colorIntensity, $size }) => {
        return css`
            color: ${theme.colors[$color ?? 'grey']?.[$colorIntensity ?? (theme.mode == 'dark' ? 200 : 600)]};
            font-size: ${$size === 'small' ? '12px' : $size === 'large' ? '16px' : theme.typography.h6.fontSize};
            padding: ${$size === 'small' ? '4px 6px' : $size === 'large' ? `12px ${PADDING}` : `10px ${PADDING}`};
            opacity: 1;
            &:hover {
                opacity: 0.7;
            }
        `;
    }}}
}`;
