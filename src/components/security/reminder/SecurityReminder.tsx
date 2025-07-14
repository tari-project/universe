import { AnimatePresence } from 'motion/react';
import { useStagedSecurityStore, useUIStore } from '@app/store';
import { BodyCopy, ChevronWrapper, CTAWrapper, Title, Wrapper } from './styles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { CTA } from '../styles.ts';

const variants = {
    show: {
        opacity: 1,
        y: 0,
    },
    hide: {
        opacity: 0,
        y: 10,
    },
};
export default function SecurityReminder() {
    const open = useStagedSecurityStore((s) => s.showReminderTip);
    const setOpen = useStagedSecurityStore((s) => s.setShowReminderTip);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const offset = useUIStore((s) => s.towerSidebarOffset);

    function handleStart() {
        setShowModal(true);
        setModalStep('ProtectIntro');
        handleClose();
    }
    function handleClose() {
        setOpen(false);
    }

    return (
        <AnimatePresence>
            {open && (
                <Wrapper variants={variants} initial="hide" animate="show" exit="hide" style={{ left: offset }}>
                    <Title>{`🔔 Protect your Tari!`}</Title>
                    <BodyCopy>{`You haven’t secured your wallet yet. Backing up your seed phrase keeps your tokens safe and ensures only you can access them.\nLet's do it now—it'll only take a moment!`}</BodyCopy>
                    <CTAWrapper>
                        <CTA
                            onClick={handleStart}
                            size="medium"
                            icon={
                                <ChevronWrapper>
                                    <ChevronSVG />
                                </ChevronWrapper>
                            }
                        >{`Start now`}</CTA>
                        <TextButton onClick={handleClose}>{`Maybe later`}</TextButton>
                    </CTAWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
