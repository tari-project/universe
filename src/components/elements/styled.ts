import { createElement, CSSProperties, ReactNode } from 'react';

import styled, { css } from 'styled-components';
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
    font-size: ${({ theme, variant }) => theme.typography[variant].fontSize};
    line-height: ${({ theme, variant }) => theme.typography[variant].lineHeight};
    letter-spacing: ${({ theme, variant }) => theme.typography[variant].letterSpacing};
    font-weight: ${({ theme, variant }) => theme.typography[variant].fontWeight || 'inherit'};
    margin: 0;
    color: inherit;
    text-align: inherit;

    ${({ variant }) =>
        variant === 'span' &&
        css`
            font-size: inherit;
            line-height: inherit;
            letter-spacing: inherit;
            font-weight: inherit;
        `}
`;
