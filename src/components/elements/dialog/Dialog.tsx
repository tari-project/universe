import {
    createContext,
    Dispatch,
    forwardRef,
    HTMLProps,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
    FloatingFocusManager,
    FloatingNode,
    FloatingPortal,
    FloatingTree,
    useClick,
    useDismiss,
    useFloating,
    useFloatingNodeId,
    useFloatingParentNodeId,
    useInteractions,
    useMergeRefs,
    useRole,
} from '@floating-ui/react';
import { ContentWrapper, Overlay } from '@app/components/elements/dialog/Dialog.styles.ts';

interface DialogOptions {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
}

export function useDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    disableClose = false,
}: DialogOptions) {
    const [labelId, setLabelId] = useState<string | undefined>();
    const [descriptionId, setDescriptionId] = useState<string | undefined>();
    const parentId = useFloatingParentNodeId();

    const nodeId = useFloatingNodeId(parentId ?? undefined);
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
    const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown', enabled: !disableClose, bubbles: false });
    const role = useRole(context);

    const interactions = useInteractions([click, dismiss, role]);

    return useMemo(
        () => ({
            open,
            setOpen,
            ...interactions,
            ...data,
            labelId,
            descriptionId,
            setLabelId,
            parentId,
            setDescriptionId,
            nodeId,
        }),
        [open, setOpen, interactions, data, labelId, descriptionId, nodeId, parentId]
    );
}

type ContextType =
    | (ReturnType<typeof useDialog> & {
          setLabelId: Dispatch<SetStateAction<string | undefined>>;
          setDescriptionId: Dispatch<SetStateAction<string | undefined>>;
      })
    | null;

const DialogContext = createContext<ContextType>(null);

export const useDialogContext = () => {
    const context = useContext(DialogContext);

    if (context == null) {
        throw new Error('Dialog components must be wrapped in <Dialog />');
    }

    return context;
};

export function Dialog({
    children,
    ...options
}: {
    children: ReactNode;
} & DialogOptions) {
    const dialog = useDialog(options);
    return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

export const DialogContent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement> & { $unPadded?: boolean }>(
    function DialogContent(props, propRef) {
        const context = useDialogContext();
        const ref = useMergeRefs([context.refs.setFloating, propRef]);

        const dialog = (
            <FloatingNode id={context.nodeId}>
                {context.open ? (
                    <FloatingPortal>
                        <Overlay lockScroll>
                            <FloatingFocusManager context={context.context}>
                                <ContentWrapper
                                    ref={ref}
                                    aria-labelledby={context.labelId}
                                    aria-describedby={context.descriptionId}
                                    {...context.getFloatingProps(props)}
                                    $unPadded={props.$unPadded}
                                >
                                    {props.children}
                                </ContentWrapper>
                            </FloatingFocusManager>
                        </Overlay>
                    </FloatingPortal>
                ) : null}
            </FloatingNode>
        );

        if (context.parentId === null) {
            return <FloatingTree>{dialog}</FloatingTree>;
        }

        return dialog;
    }
);
