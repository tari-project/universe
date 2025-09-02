import { CSSProperties, HTMLProps, ReactNode, Ref } from 'react';
type DialogVariant = 'primary' | 'transparent';

export interface DialogOptions {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
}
export interface ContentWrapperProps {
    variant?: DialogVariant;
    closeButton?: ReactNode;
    style?: CSSProperties;
}
export interface ContentWrapperStyleProps {
    $variant?: DialogVariant;
    $unPadded?: boolean;
    $allowOverflow?: boolean;
}

export interface DialogContentType extends HTMLProps<HTMLDivElement>, ContentWrapperProps, ContentWrapperStyleProps {
    ref?: Ref<HTMLDivElement>;
}
export interface DialogProps extends DialogOptions {
    children: ReactNode;
}
