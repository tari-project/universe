import { CSSProperties, HTMLProps, ReactNode, Ref } from 'react';

export interface DialogOptions {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
}
type DialogVariant = 'primary' | 'transparent';
export interface ContentWrapperProps {
    variant?: DialogVariant;
    style?: CSSProperties;
}
export interface ContentWrapperStyleProps {
    $variant?: DialogVariant;
    $unPadded?: boolean;
}

export interface DialogContentType extends HTMLProps<HTMLDivElement>, ContentWrapperProps, ContentWrapperStyleProps {
    ref?: Ref<HTMLDivElement>;
}
export interface DialogProps extends DialogOptions {
    children: ReactNode;
}
