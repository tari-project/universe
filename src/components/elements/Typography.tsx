import { ReactNode, CSSProperties, HTMLAttributes } from 'react';

import { DynamicTypography } from './styled';

export type TagVariants = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

interface TypographyProps extends HTMLAttributes<HTMLDivElement> {
    variant?: TagVariants;
    children: ReactNode;
    fontFamily?: string;
}

export const Typography = ({
    variant = 'span',
    children,
    fontFamily = 'inherit',
    ...props
}: TypographyProps & CSSProperties) => (
    <DynamicTypography variant={variant} fontFamily={fontFamily} {...props}>
        {children}
    </DynamicTypography>
);
