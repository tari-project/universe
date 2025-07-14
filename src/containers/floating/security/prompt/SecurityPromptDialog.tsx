import { useTranslation } from 'react-i18next';
import { useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Step, StepItem } from '@app/components/security/step/Step.tsx';
import { Content, Header, Subtitle, Title, Wrapper, CTAWrapper, ContentWrapper } from '../common.styles.ts';

import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

export default function SecurityPromptDialog() {
    const { t } = useTranslation(['staged-security']);
    const [seedBackedUp, setSeedBackedUp] = useState(false);
    const [pinLocked, setPinLocked] = useState(false);
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);

    const isOpen = showModal && step === 'ProtectIntro';
    function handleClose() {
        setShowModal(false);
    }
    function handleClick() {
        if (!seedBackedUp) {
            setModalStep('SeedPhrase');
        } else {
            setModalStep('CreatePin');
        }
    }

    useEffect(() => {
        invoke('is_seed_backed_up').then((r) => {
            setSeedBackedUp(!!r);
        });
    }, [isOpen]);

    useEffect(() => {
        invoke('is_pin_locked').then((r) => setPinLocked(!!r));
    }, [isOpen]);

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
            <DialogContent $transparentBg $unPadded>
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
