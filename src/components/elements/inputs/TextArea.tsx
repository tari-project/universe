import styled, { css } from 'styled-components';
import { TextareaHTMLAttributes } from 'react';

const Wrapper = styled.div<{ $minWidth?: string; $minHeight?: string }>`
    width: 100%;
    min-width: ${({ $minWidth }) => $minWidth};
    min-height: ${({ $minHeight }) => $minHeight};
    display: flex;
`;
const StyledTextArea = styled.textarea<{ $variant?: 'primary' | 'secondary' }>`
    width: 100%;
    border-radius: 10px;
    padding: 10px;
    line-height: 1.2;
    resize: none;
    transition: box-shadow 0.2s ease-in-out;
    box-shadow: 0 0 1px 3px ${({ theme }) => theme.palette.primary.wisp};
    color: ${({ theme }) => theme.palette.text.accent};
    &:focus {
        box-shadow: 0 0 2px 4px ${({ theme }) => theme.palette.primary.shadow};
    }

    &::placeholder {
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    ${({ $variant }) =>
        $variant === 'secondary' &&
        css`
            box-shadow: none;
        `}
`;

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    minWidth?: string;
    minHeight?: string;
    variant?: 'primary' | 'secondary';
}
export function TextArea({ minWidth, minHeight, variant = 'primary', ...props }: TextAreaProps) {
    return (
        <Wrapper $minWidth={minWidth} $minHeight={minHeight}>
            <StyledTextArea $variant={variant} {...props} />
        </Wrapper>
    );
}
