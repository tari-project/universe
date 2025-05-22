/* eslint-disable i18next/no-literal-string */
import { MenuWrapper, MenuContent, ToggleButton } from './styles';
import { useFloating, offset, shift, flip, useClick, useInteractions, useDismiss } from '@floating-ui/react';
import { memo, useState } from 'react';
import { ThemeGroup } from './groups/ThemeGroup';
import { DialogsGroup } from './groups/DialogsGroup';
import { GreenModalsGroup } from './groups/GreenModalsGroup';
import { OtherUIGroup } from './groups/OtherUIGroup';
import { AnimatePresence } from 'motion/react';
import { SwapsGroup } from './groups/SwapsGroup';

const AdminUI = memo(function AdminUI() {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(10), flip(), shift()],
        placement: 'bottom-end',
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    return (
        <>
            <ToggleButton ref={refs.setReference} {...getReferenceProps()} $isOpen={isOpen}>
                Admin UI
            </ToggleButton>
            <AnimatePresence>
                {isOpen && (
                    <MenuWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <MenuContent
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <ThemeGroup />
                            <DialogsGroup />
                            <GreenModalsGroup />
                            <SwapsGroup />
                            <OtherUIGroup />
                        </MenuContent>
                    </MenuWrapper>
                )}
            </AnimatePresence>
        </>
    );
});

export default AdminUI;
