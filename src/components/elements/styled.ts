import { createElement, CSSProperties, ReactNode } from 'react';

import styled from 'styled-components';
import { TagVariants } from '@app/components/elements/Typography.tsx';

interface TypographyProps {
    variant: TagVariants;
    children: ReactNode;
    fontFamily?: string;
}

export const DynamicTypography = styled(({ variant = 'span', children, ...props }: TypographyProps & CSSProperties) =>
    createElement(variant, props, children)
)`
    font-family: ${({ fontFamily }) => fontFamily};
    font-size: ${({ theme, variant }) => (variant === 'span' ? 'inherit' : theme.typography[variant].fontSize)};
    line-height: ${({ theme, variant }) => theme.typography[variant].lineHeight};
    letter-spacing: ${({ theme, variant }) => theme.typography[variant].letterSpacing};
    font-weight: ${({ theme, variant }) => theme.typography[variant].fontWeight || 'inherit'};
    margin: 0;
    color: inherit;
    text-align: inherit;
`;
