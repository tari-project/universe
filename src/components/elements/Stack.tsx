import { CSSProperties, HTMLAttributes } from 'react';
import styled from 'styled-components';

type StackFlexProps = Partial<
    Pick<CSSProperties, 'justifyContent' | 'justifyItems' | 'alignItems' | 'alignContent' | 'flexDirection'>
>;

interface StackProps extends HTMLAttributes<HTMLDivElement>, StackFlexProps {
    direction?: StackFlexProps['flexDirection'];
    gap?: number;
}

const StyledStack = styled.div<{
    $direction?: StackProps['direction'];
    $justifyContent?: StackProps['justifyContent'];
    $alignItems?: StackProps['alignItems'];
    $gap?: StackProps['gap'];
}>`
    display: flex;
    flex-direction: ${({ $direction }) => $direction};
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $alignItems }) => $alignItems};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    gap: ${({ $gap }) => `${$gap}px`};
`;

export function Stack({
    children,
    direction = 'column',
    justifyContent = 'center',
    alignItems,
    gap = 4,
    ...props
}: StackProps) {
    return (
        <StyledStack
            $direction={direction}
            $justifyContent={justifyContent}
            $alignItems={alignItems}
            $gap={gap}
            {...props}
        >
            {children}
        </StyledStack>
    );
}
