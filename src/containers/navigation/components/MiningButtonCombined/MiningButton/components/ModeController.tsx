import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { offset, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';
import styled from 'styled-components';
import ModeDropdown from './ModeDropdown/ModeDropdown.tsx';
import EcoAlert from './tooltip/EcoAlert.tsx';

const RefWrapper = styled.div``;

export default function ModeController() {
    const [showModeAlert, setShowModeAlert] = useState(true);

    const { refs, floatingStyles, context } = useFloating({
        open: showModeAlert,
        onOpenChange: setShowModeAlert,
        placement: 'right-start',
        middleware: [offset({ mainAxis: 20, alignmentAxis: -4 })],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const { getFloatingProps } = useInteractions([click, dismiss, role]);

    return (
        <>
            <RefWrapper ref={refs.setReference}>
                <ModeDropdown />
            </RefWrapper>
            <AnimatePresence>
                {showModeAlert && (
                    <RefWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <EcoAlert />
                    </RefWrapper>
                )}
            </AnimatePresence>
        </>
    );
}
