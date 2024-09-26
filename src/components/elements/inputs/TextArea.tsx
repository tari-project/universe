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
    resize: none;
    transition: box-shadow 0.2s ease-in-out;
    &:focus {
        box-shadow: 0 0 2px 4px ${({ theme }) => theme.palette.primary.wisp};
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
