import { AnimatePresence } from 'motion/react';
import { FloatingFocusManager, FloatingNode, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import { DialogContext, useDialog, useDialogContext } from './helpers.ts';
import { DialogContentType, DialogProps } from './types.ts';
import { ContentScrollContainer, ContentWrapper, Overlay } from './Dialog.styles.ts';

import { create as motionCreate } from 'motion/react-m';

const MotionOverlay = motionCreate(Overlay);
const MotionWrapper = motionCreate(ContentScrollContainer);

export function Dialog({ children, ...options }: DialogProps) {
    const dialog = useDialog(options);
    return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

export function DialogContent({ variant = 'primary', ...props }: DialogContentType) {
    const context = useDialogContext();
    const ref = useMergeRefs([context.refs.setFloating, props.ref]);

    return (
        <FloatingNode id={context.nodeId} key={context.nodeId}>
            <AnimatePresence>
                {context.open ? (
                    <FloatingPortal>
                        <FloatingFocusManager context={context.context} modal={false}>
                            <MotionOverlay
                                className="overlay"
                                initial={{ backgroundColor: `rgba(0, 0, 0, 0)` }}
                                animate={{ backgroundColor: `rgba(0, 0, 0, 0.4)` }}
                                exit={{ backgroundColor: `rgba(0, 0, 0, 0)` }}
                                lockScroll
                            >
                                <MotionWrapper
                                    aria-labelledby={context.nodeId}
                                    aria-describedby={`Dialog_${context.nodeId}`}
                                    $variant={variant}
                                    $unPadded={props.$unPadded}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <ContentWrapper ref={ref} {...props} {...context.getFloatingProps(props)}>
                                        {props.children}
                                    </ContentWrapper>
                                </MotionWrapper>
                            </MotionOverlay>
                        </FloatingFocusManager>
                    </FloatingPortal>
                ) : null}
            </AnimatePresence>
        </FloatingNode>
    );
}
