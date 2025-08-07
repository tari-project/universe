import { ReactNode, CSSProperties, HTMLAttributes } from 'react';

import { DynamicTypography } from './styled';

type TagVariants = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

interface TypographyProps extends HTMLAttributes<HTMLDivElement> {
    variant?: TagVariants;
    children: ReactNode;
    fontFamily?: string;
}

function Typography({ variant = 'span', children, fontFamily = 'inherit', ...props }: TypographyProps & CSSProperties) {
    return (
        <DynamicTypography variant={variant} fontFamily={fontFamily} {...props}>
            {children}
        </DynamicTypography>
    );
}

export { type TagVariants, Typography };
