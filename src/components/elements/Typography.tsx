import { ReactNode, CSSProperties, HTMLAttributes } from 'react';

import { DynamicTypography } from './styled';

export type TagVariants = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

export interface TypographyProps extends HTMLAttributes<HTMLDivElement> {
    variant?: TagVariants;
    children: ReactNode;
}

export const Typography = ({ variant = 'p', children, ...props }: TypographyProps & CSSProperties) => (
    <DynamicTypography variant={variant} {...props}>
        {children}
    </DynamicTypography>
);
