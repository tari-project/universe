import styled, { css } from 'styled-components';
import { ButtonBaseProps } from '@app/components/elements/Button.tsx';

interface Props {
    $variant?: ButtonBaseProps['variant'];
    $color?: ButtonBaseProps['color'];
}
export const StyledButtonBase = styled.button<Props>`
    cursor: pointer;
    display: inline-flex;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
    letter-spacing: ${({ theme }) => theme.typography.h6.letterSpacing};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonBase};
`;
