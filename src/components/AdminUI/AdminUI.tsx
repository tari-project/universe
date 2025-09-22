import { MenuWrapper, MenuContent, ToggleButton } from './styles';
import {
    useFloating,
    offset,
    shift,
    flip,
    useClick,
    useInteractions,
    useDismiss,
    FloatingNode,
    FloatingPortal,
    useFloatingNodeId,
} from '@floating-ui/react';
import { memo, useState } from 'react';
import { ThemeGroup } from './groups/ThemeGroup';
import { DialogsGroup } from './groups/DialogsGroup';
import { GreenModalsGroup } from './groups/GreenModalsGroup';
import { OtherUIGroup } from './groups/OtherUIGroup';
import { ToastsGroup } from './groups/ToastsGroup';
import { CollapsibleGroup } from './CollapsibleGroup';
import { AnimatePresence } from 'motion/react';
import { FeedbackGroup } from './groups/FeedbackGroup.tsx';

const AdminUI = memo(function AdminUI() {
    const [isOpen, setIsOpen] = useState(false);
    const nodeId = useFloatingNodeId();
    const { refs, floatingStyles, context } = useFloating({
        nodeId,
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(5), flip(), shift()],
        placement: 'bottom-end',
    });

    const click = useClick(context);
    const dismiss = useDismiss(context, { bubbles: false });
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    return (
        <>
            <ToggleButton ref={refs.setReference} {...getReferenceProps()} $isOpen={isOpen}>
                {`Admin UI`}
            </ToggleButton>
            <FloatingNode id={nodeId}>
                <AnimatePresence>
                    {isOpen ? (
                        <FloatingPortal>
                            <MenuWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                                <MenuContent
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    <CollapsibleGroup title="Theme" defaultOpen={true}>
                                        <ThemeGroup />
                                    </CollapsibleGroup>
                                    <CollapsibleGroup title="Feedback" defaultOpen={true}>
                                        <FeedbackGroup />
                                    </CollapsibleGroup>
                                    <CollapsibleGroup title="Dialogs" defaultOpen={false}>
                                        <DialogsGroup />
                                    </CollapsibleGroup>
                                    <CollapsibleGroup title="Green Modals" defaultOpen={false}>
                                        <GreenModalsGroup />
                                    </CollapsibleGroup>
                                    <CollapsibleGroup title="Toasts" defaultOpen={false}>
                                        <ToastsGroup />
                                    </CollapsibleGroup>
                                    <CollapsibleGroup title="Other UI" defaultOpen={false}>
                                        <OtherUIGroup />
                                    </CollapsibleGroup>
                                </MenuContent>
                            </MenuWrapper>
                        </FloatingPortal>
                    ) : null}
                </AnimatePresence>
            </FloatingNode>
        </>
    );
});

export default AdminUI;
