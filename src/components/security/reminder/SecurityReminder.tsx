import { AnimatePresence } from 'motion/react';
import { useSecurityStore, useUIStore } from '@app/store';
import { BodyCopy, ChevronWrapper, CTAWrapper, Title, Wrapper } from './styles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

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
    const open = useSecurityStore((s) => s.showReminderTip);
    const setOpen = useSecurityStore((s) => s.setShowReminderTip);
    const setModal = useSecurityStore((s) => s.setModal);
    const offset = useUIStore((s) => s.towerSidebarOffset);

    function handleStart() {
        setModal('intro');
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
                        <Button
                            variant="black"
                            onClick={handleStart}
                            size="medium"
                            icon={
                                <ChevronWrapper>
                                    <ChevronSVG />
                                </ChevronWrapper>
                            }
                        >{`Start now`}</Button>
                        <TextButton onClick={handleClose}>{`Maybe later`}</TextButton>
                    </CTAWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
