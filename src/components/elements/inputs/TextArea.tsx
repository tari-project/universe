import styled from 'styled-components';
import { TextareaHTMLAttributes } from 'react';

const Wrapper = styled.div<{ $minWidth?: number }>`
    width: 100%;
    min-width: ${({ $minWidth }) => $minWidth}px;
    display: flex;
`;
const StyledTextArea = styled.textarea`
    min-height: 250px;
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
`;

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    minWidth?: number;
}
export function TextArea({ minWidth = 500, ...props }: TextAreaProps) {
    return (
        <Wrapper $minWidth={minWidth}>
            <StyledTextArea {...props} />
        </Wrapper>
    );
}
