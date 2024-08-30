import { createElement, CSSProperties, ReactNode } from 'react';

import styled from 'styled-components';
import { TagVariants } from '@app/components/elements/Typography.tsx';

interface TypographyProps {
    variant: TagVariants;
    children: ReactNode;
}

export const DynamicTypography = styled(({ variant = 'p', children, ...props }: TypographyProps & CSSProperties) =>
    createElement(variant, props, children)
)`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme, variant }) => theme.typography[variant].fontSize};
    line-height: ${({ theme, variant }) => theme.typography[variant].lineHeight};
    letter-spacing: ${({ theme, variant }) => theme.typography[variant].letterSpacing};
    font-weight: ${({ theme, variant }) => theme.typography[variant].fontWeight || 400};
    margin: 0;
    display: flex;
`;
