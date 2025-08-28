import { FloatingFocusManager, FloatingNode, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import { DialogContext, useDialog, useDialogContext } from './helpers.ts';
import { DialogContentType, DialogProps } from './types.ts';
import { ContentScrollContainer, ContentWrapper, Overlay } from './Dialog.styles.ts';

export function Dialog({ children, ...options }: DialogProps) {
    const dialog = useDialog(options);
    return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

export function DialogContent({ variant = 'primary', ...props }: DialogContentType) {
    const context = useDialogContext();
    const ref = useMergeRefs([context.refs.setFloating, props.ref]);

    return (
        <FloatingNode id={context.nodeId} key={context.nodeId}>
            {context.open ? (
                <FloatingPortal>
                    <Overlay lockScroll className="overlay">
                        <FloatingFocusManager context={context.context} modal={false}>
                            <ContentScrollContainer $variant={variant} $unPadded={props.$unPadded}>
                                <ContentWrapper
                                    ref={ref}
                                    {...props}
                                    {...context.getFloatingProps(props)}
                                    aria-labelledby={context.nodeId}
                                    aria-describedby={`Dialog_${context.nodeId}`}
                                >
                                    {props.children}
                                </ContentWrapper>
                            </ContentScrollContainer>
                        </FloatingFocusManager>
                    </Overlay>
                </FloatingPortal>
            ) : null}
        </FloatingNode>
    );
}
