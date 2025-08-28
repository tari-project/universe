import { FloatingFocusManager, FloatingNode, FloatingPortal, useMergeRefs } from '@floating-ui/react';

import { DialogContentType, DialogProps } from './types.ts';
import { DialogContext, useDialog, useDialogContext } from './helpers.ts';
import { ContentWrapper, Overlay } from './Dialog.styles.ts';

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
                    <Overlay lockScroll className="overlay" $zIndex={props.$zIndex}>
                        <FloatingFocusManager context={context.context} modal={false}>
                            <ContentWrapper
                                ref={ref}
                                {...props}
                                {...context.getFloatingProps(props)}
                                aria-labelledby={context.nodeId}
                                aria-describedby={`Dialog_${context.nodeId}`}
                                $variant={variant}
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
