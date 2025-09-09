import styled, { css } from 'styled-components';
import { TextareaHTMLAttributes } from 'react';
import { convertHexToRGBA } from '@app/utils';

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
    white-space: pre-wrap;
    box-shadow: 0 0 1px 3px ${({ theme }) => convertHexToRGBA(theme.palette.focusOutline, 0.1)};
    color: ${({ theme }) => theme.palette.text.accent};

    &::placeholder {
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    ${({ $variant }) =>
        $variant === 'secondary' &&
        css`
            box-shadow: none;
            &:focus-visible {
                outline: 2px solid ${({ theme }) => theme.palette.focusOutlineAlpha};
                outline-offset: 2px;
                transition: none;
            }
        `}
`;

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    minWidth?: string;
    minHeight?: string;
    variant?: 'primary' | 'secondary';
}
export const TextArea = ({ minWidth, minHeight, variant = 'primary', ...props }: TextAreaProps) => {
    return (
        <Wrapper $minWidth={minWidth} $minHeight={minHeight}>
            <StyledTextArea $variant={variant} {...props} />
        </Wrapper>
    );
};
