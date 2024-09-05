import { ContentWrapper, Overlay, TriggerWrapper } from './Dialog.styles.ts';
import { ReactNode, useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    FloatingFocusManager,
    FloatingPortal,
    useClick,
    useDismiss,
    useFloating,
    useId,
    useInteractions,
    useRole,
} from '@floating-ui/react';

interface DialogProps {
    children: ReactNode;
    heading?: string;
}
export function Dialog({ children, heading }: DialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
    });

    const click = useClick(context);
    const role = useRole(context);
    const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });

    const { getReferenceProps, getFloatingProps } = useInteractions([click, role, dismiss]);

    const headingId = useId();
    const descriptionId = useId();

    const trigger = (
        <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
            <p>hello {isOpen}</p>
        </TriggerWrapper>
    );
    return (
        <>
            {trigger}
            <FloatingPortal id="portal-root">
                {isOpen && (
                    <Overlay lockScroll>
                        <FloatingFocusManager context={context}>
                            <ContentWrapper
                                ref={refs.setFloating}
                                aria-labelledby={headingId}
                                aria-describedby={descriptionId}
                                {...getFloatingProps()}
                            >
                                {heading ? (
                                    <Typography id={headingId} variant="h3">
                                        {heading}
                                    </Typography>
                                ) : null}
                                <ContentWrapper>{children}</ContentWrapper>
                                <button
                                    onClick={() => {
                                        console.log('Deleted.');
                                        setIsOpen(false);
                                    }}
                                >
                                    Confirm
                                </button>
                                <button onClick={() => setIsOpen(false)}>Cancel</button>
                            </ContentWrapper>
                        </FloatingFocusManager>
                    </Overlay>
                )}
            </FloatingPortal>
        </>
    );
}
