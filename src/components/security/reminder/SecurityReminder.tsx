import { AnimatePresence } from 'motion/react';
import { useSecurityStore, useUIStore } from '@app/store';
import { BodyCopy, ChevronWrapper, CTAWrapper, Title, Wrapper } from './styles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { t } from 'i18next';

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
                    <Title>🔔 {t('security.reminder.title')}</Title>
                    <BodyCopy>{t('security.reminder.description')}</BodyCopy>
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
                        >
                            {t('security.reminder.start-now')}
                        </Button>
                        <TextButton onClick={handleClose}>{t('security.reminder.maybe-later')}</TextButton>
                    </CTAWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
