import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { offset, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';
import styled from 'styled-components';
import EcoAlert from './tooltip/EcoAlert.tsx';
import { useMiningStore } from '@app/store';
import { setShowEcoAlert } from '@app/store/actions/miningStoreActions.ts';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions.ts';
import { invoke } from '@tauri-apps/api/core';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';

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

    function handleCloseAlert() {
        invoke('set_eco_alert_needed').then(() => {
            setShowEcoAlert(false);
        });
    }

    function handleModesClick() {
        setModesOpen(true);
        handleCloseAlert();
    }

    function handleTurboClick() {
        selectMiningMode('Turbo').then(handleCloseAlert);
    }

    return (
        <>
            <RefWrapper ref={refs.setReference}>
                <MiningMode open={modesOpen} />
            </RefWrapper>
            <AnimatePresence>
                {showEcoAlert && (
                    <RefWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <m.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <EcoAlert onAllClick={handleModesClick} onTurboClick={handleTurboClick} />
                        </m.div>
                    </RefWrapper>
                )}
            </AnimatePresence>
        </>
    );
}
