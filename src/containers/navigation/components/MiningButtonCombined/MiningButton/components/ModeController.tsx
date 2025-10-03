import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { offset, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';
import styled from 'styled-components';
import ModeDropdown from './ModeDropdown/ModeDropdown.tsx';
import EcoAlert from './tooltip/EcoAlert.tsx';
import { useMiningStore } from '@app/store';
import { setShowEcoAlert } from '@app/store/actions/miningStoreActions.ts';

const RefWrapper = styled.div``;

export default function ModeController() {
    const [modesOpen, setModesOpen] = useState(false);
    const showEcoAlert = useMiningStore((s) => s.showEcoAlert);

    const { refs, floatingStyles, context } = useFloating({
        open: showEcoAlert,
        onOpenChange: setShowEcoAlert,
        placement: 'right-start',
        middleware: [offset({ mainAxis: 20, alignmentAxis: -4 })],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const { getFloatingProps } = useInteractions([click, dismiss, role]);

    function handleModesClick() {
        setModesOpen(true);
        setShowEcoAlert(false);
    }

    return (
        <>
            <RefWrapper ref={refs.setReference}>
                <ModeDropdown open={modesOpen} />
            </RefWrapper>
            <AnimatePresence>
                {showEcoAlert && (
                    <RefWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <EcoAlert onAllClick={handleModesClick} />
                    </RefWrapper>
                )}
            </AnimatePresence>
        </>
    );
}
