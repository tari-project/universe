import { ReactNode, CSSProperties, HTMLAttributes, memo } from 'react';

import { DynamicTypography } from './styled';

export type TagVariants = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

interface TypographyProps extends HTMLAttributes<HTMLDivElement> {
    variant?: TagVariants;
    children: ReactNode;
    fontFamily?: string;
}

const Typography = memo(function Typography({
    variant = 'span',
    children,
    fontFamily = 'inherit',
    ...props
}: TypographyProps & CSSProperties) {
    return (
        <DynamicTypography variant={variant} fontFamily={fontFamily} {...props}>
            {children}
        </DynamicTypography>
    );
});

export { Typography };
