import { AnimatePresence } from 'motion/react';
import { useStagedSecurityStore, useUIStore } from '@app/store';
import { BodyCopy, Title, Wrapper } from './styles.ts';

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
    const offset = useUIStore((s) => s.towerSidebarOffset);
    function onOpenChange() {
        setOpen(!open);
    }

    return (
        <AnimatePresence>
            {open && (
                <Wrapper variants={variants} initial="hide" animate="show" exit="hide" style={{ left: offset }}>
                    <Title>{`🔔 Protect your Tari!`}</Title>
                    <BodyCopy>{`You haven’t secured your wallet yet. Backing up your seed phrase keeps your tokens safe and ensures only you can access them.\nLet's do it now—it'll only take a moment!`}</BodyCopy>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
