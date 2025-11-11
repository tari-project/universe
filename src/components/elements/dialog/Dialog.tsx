import { AnimatePresence } from 'motion/react';
import { FloatingFocusManager, FloatingNode, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import { DialogContext, useDialog, useDialogContext } from './helpers.ts';
import { DialogContentType, DialogProps } from './types.ts';
import {
    CloseButtonContainer,
    Content,
    ContentScrollContainer,
    ContentWrapper,
    Vignette,
    Overlay,
    WrapperContent,
} from './Dialog.styles.ts';

import { create as motionCreate } from 'motion/react-m';

const MotionOverlay = motionCreate(Overlay);
const MotionWrapper = motionCreate(ContentWrapper);

export function Dialog({ children, ...options }: DialogProps) {
    const dialog = useDialog(options);
    return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

export function DialogContent({ variant = 'primary', closeButton, ...props }: DialogContentType) {
    const context = useDialogContext();
    const ref = useMergeRefs([context.refs.setFloating, props.ref]);

    const markup =
        variant !== 'wrapper' ? (
            <MotionWrapper
                aria-labelledby={context.nodeId}
                aria-describedby={`Dialog_${context.nodeId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                $variant={variant}
                $unPadded={props.$unPadded}
                $allowOverflow={props.$allowOverflow}
            >
                <ContentScrollContainer $allowOverflow={props.$allowOverflow}>
                    <Content
                        ref={ref}
                        {...props}
                        {...context.getFloatingProps(props)}
                        $allowOverflow={props.$allowOverflow}
                    >
                        {closeButton ? <CloseButtonContainer>{closeButton}</CloseButtonContainer> : null}
                        {props.children}
                    </Content>
                </ContentScrollContainer>
            </MotionWrapper>
        ) : (
            <WrapperContent
                {...context.getFloatingProps(props)}
                aria-labelledby={context.nodeId}
                aria-describedby={`Dialog_${context.nodeId}`}
                ref={ref}
            >
                {props.children}
            </WrapperContent>
        );
    return (
        <FloatingNode id={context.nodeId} key={context.nodeId}>
            <AnimatePresence>
                {context.open ? (
                    <FloatingPortal>
                        <FloatingFocusManager context={context.context}>
                            <MotionOverlay
                                className="overlay"
                                initial={{ backgroundColor: `rgba(0, 0, 0, 0)` }}
                                animate={{ backgroundColor: `rgba(0, 0, 0, 0.4)` }}
                                exit={{ backgroundColor: `rgba(0, 0, 0, 0)` }}
                                lockScroll
                            >
                                {markup}
                            </MotionOverlay>
                        </FloatingFocusManager>
                        <Vignette initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    </FloatingPortal>
                ) : null}
            </AnimatePresence>
        </FloatingNode>
    );
}
