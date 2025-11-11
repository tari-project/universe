import { createContext, useContext, useMemo } from 'react';
import { useClick, useDismiss, useFloating, useFloatingNodeId, useInteractions, useRole } from '@floating-ui/react';
import { DialogOptions } from './types.ts';

export function useDialog({ open, onOpenChange, disableClose = false }: DialogOptions) {
    const nodeId = useFloatingNodeId();
    const data = useFloating({ nodeId, open, onOpenChange });
    const role = useRole(data.context);
    const click = useClick(data.context, { enabled: open == null });
    const dismiss = useDismiss(data.context, {
        outsidePressEvent: 'mousedown',
        outsidePress: (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            return target.classList.contains('overlay');
        },
        enabled: !disableClose,
        bubbles: {
            outsidePress: true,
        },
    });

    const interactions = useInteractions([click, dismiss, role]);

    return useMemo(
        () => ({
            open,
            onOpenChange,
            nodeId,
            ...interactions,
            ...data,
        }),
        [open, onOpenChange, interactions, data, nodeId]
    );
}

export const DialogContext = createContext<ReturnType<typeof useDialog> | null>(null);
export const useDialogContext = () => {
    const context = useContext(DialogContext);
    if (context == null) {
        throw new Error('Dialog components must be wrapped in <Dialog />');
    }
    return context;
};
