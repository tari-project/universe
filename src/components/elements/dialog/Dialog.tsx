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
    useClick,
    useDismiss,
    useFloating,
    useFloatingNodeId,
    useInteractions,
    useMergeRefs,
    useRole,
} from '@floating-ui/react';
import { type } from '@tauri-apps/plugin-os';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { ContentWrapper, ContentWrapperProps, Overlay } from './Dialog.styles.ts';

interface DialogOptions {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    disableClose?: boolean;
}

function useDialog({ open: controlledOpen, onOpenChange: setControlledOpen, disableClose = false }: DialogOptions) {
    const [labelId, setLabelId] = useState<string | undefined>();
    const [descriptionId, setDescriptionId] = useState<string | undefined>();
    const nodeId = useFloatingNodeId();
    const hasError = useAppStateStore((s) => !!s.error);

    const dismissEnabled = !hasError && !disableClose;

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
            ...interactions,
            ...data,
            labelId,
            descriptionId,
            setLabelId,
            nodeId,
            setDescriptionId,
        }),
        [open, setOpen, interactions, data, labelId, descriptionId, nodeId]
    );
}

type ContextType =
    | (ReturnType<typeof useDialog> & {
          setLabelId: Dispatch<SetStateAction<string | undefined>>;
          setDescriptionId: Dispatch<SetStateAction<string | undefined>>;
      })
    | null;

const DialogContext = createContext<ContextType>(null);

const useDialogContext = () => {
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

export const DialogContent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement> & ContentWrapperProps>(
    function DialogContent(props, propRef) {
        const osType = type();

        const isNotLinux = osType !== 'linux';
        const context = useDialogContext();
        const ref = useMergeRefs([context.refs.setFloating, propRef]);

        const transparentBg = props.$transparentBg && isNotLinux;

        return (
            <FloatingNode id={context.nodeId} key={context.nodeId}>
                {context.open ? (
                    <FloatingPortal>
                        <Overlay lockScroll className="overlay" $zIndex={props.$zIndex}>
                            <FloatingFocusManager context={context.context} modal={false}>
                                <ContentWrapper
                                    ref={ref}
                                    {...context.getFloatingProps(props)}
                                    aria-labelledby={context.labelId}
                                    aria-describedby={context.descriptionId}
                                    $unPadded={props.$unPadded}
                                    $disableOverflow={props.$disableOverflow}
                                    $borderRadius={props.$borderRadius}
                                    $transparentBg={transparentBg}
                                >
                                    {props.children}
                                </ContentWrapper>
                            </FloatingFocusManager>
                        </Overlay>
                    </FloatingPortal>
                ) : null}
            </FloatingNode>
        );
    }
);
