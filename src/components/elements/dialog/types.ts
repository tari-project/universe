import { HTMLProps, Ref } from 'react';
import { ContentWrapperProps } from '@app/components/elements/dialog/Dialog.styles.ts';

export interface DialogOptions {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
}

export interface DialogContentType extends HTMLProps<HTMLDivElement>, ContentWrapperProps {
    ref?: Ref<HTMLDivElement>;
}
