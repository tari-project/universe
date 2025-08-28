import { ReactNode } from 'react';
import { FloatingFocusManager, FloatingNode, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import { type } from '@tauri-apps/plugin-os';
import { ContentWrapper, Overlay } from './Dialog.styles.ts';
import { DialogContext, useDialog, useDialogContext } from './helpers.ts';
import { DialogContentType, DialogOptions } from './types.ts';

export function Dialog({
    children,
    ...options
}: {
    children: ReactNode;
} & DialogOptions) {
    const dialog = useDialog(options);
    return <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
}

export function DialogContent(props: DialogContentType) {
    const osType = type();

    const isNotLinux = osType !== 'linux';
    const context = useDialogContext();
    const ref = useMergeRefs([context.refs.setFloating, props.ref]);

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
                                aria-labelledby={context.nodeId}
                                aria-describedby={`Dialog_${context.nodeId}`}
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
