import { createContext, useContext, useMemo } from 'react';
import { useClick, useDismiss, useFloating, useFloatingNodeId, useInteractions, useRole } from '@floating-ui/react';
import { DialogOptions } from './types.ts';

export function useDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    disableClose = false,
}: DialogOptions) {
    const nodeId = useFloatingNodeId();

    const dismissEnabled = !disableClose;

    const open = controlledOpen;
    const setOpen = setControlledOpen;

    const data = useFloating({
        nodeId,
        open,
        onOpenChange: setOpen,
    });

    const context = data.context;

    const click = useClick(context, {
        enabled: controlledOpen == null,
    });
    const dismiss = useDismiss(context, {
        outsidePressEvent: 'mousedown',
        outsidePress: (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            return target.classList.contains('overlay');
        },
        enabled: dismissEnabled,
        bubbles: {
            escapeKey: false,
            outsidePress: true,
        },
    });
    const role = useRole(context);
    const interactions = useInteractions([click, dismiss, role]);

    return useMemo(
        () => ({
            open,
            setOpen,
            nodeId,
            ...interactions,
            ...data,
        }),
        [open, setOpen, interactions, data, nodeId]
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
