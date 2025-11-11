import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Step, StepItem } from '@app/components/security/step/Step.tsx';
import { Content, Header, Subtitle, Title, Wrapper, CTAWrapper, ContentWrapper } from '../common.styles.ts';

import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { invoke } from '@tauri-apps/api/core';
import { useSecurityStore, useWalletStore } from '@app/store';

export default function SecurityPromptDialog() {
    const { t } = useTranslation(['staged-security']);
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);

    const isOpen = modal === 'intro';

    const seedBackedUp = useWalletStore((s) => s.is_seed_backed_up);
    const pinLocked = useWalletStore((s) => s.is_pin_locked);

    function handleClose() {
        invoke('set_security_warning_dismissed').then(() => {
            setModal(null);
        });
    }
    function handleClick() {
        if (!seedBackedUp) {
            setModal('verify_seedphrase');
        } else if (!pinLocked) {
            void invoke('create_pin');
        }
    }

    const steps: StepItem[] = [
        {
            stepNumber: 1,
            completed: seedBackedUp,
            title: t('steps.title-seeds'),
            subtitle: t('steps.subtitle-seeds'),
        },
        {
            stepNumber: 2,
            completed: pinLocked,
            title: t('steps.title-pin'),
            subtitle: t('steps.subtitle-pin'),
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <Content>
                        <AlertChip text={t('intro.warning')} />
                        <Title>{t('intro.title')}</Title>
                        <Subtitle>{t('intro.subtitle')}</Subtitle>
                        <ContentWrapper>
                            {steps.map((step) => (
                                <Step key={step.stepNumber + step.title} {...step} />
                            ))}
                        </ContentWrapper>
                        <CTAWrapper>
                            <Button fluid variant="black" size="xlarge" onClick={handleClick}>
                                {t('intro.button')}
                            </Button>
                            <TextButton onClick={handleClose}>{t('skip')}</TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
