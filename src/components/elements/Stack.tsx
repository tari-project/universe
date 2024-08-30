import { HTMLAttributes } from 'react';
import styled from 'styled-components';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
    direction?: 'column' | 'row';
    justifyContent?: 'space-between' | 'center' | 'flex-start' | 'flex-end';
}

const StyledStack = styled.div<{
    $direction?: StackProps['direction'];
    $justifyContent?: StackProps['justifyContent'];
}>`
    display: flex;
    flex-direction: ${({ $direction }) => $direction};
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $direction }) => ($direction === 'row' ? 'center' : 'stretch')};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    gap: 4px;
`;

export function Stack({ children, direction = 'column', justifyContent = 'center', ...props }: StackProps) {
    return (
        <StyledStack $direction={direction} $justifyContent={justifyContent} {...props}>
            {children}
        </StyledStack>
    );
}
