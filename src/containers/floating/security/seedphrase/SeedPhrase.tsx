import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';

import { setDialogToShow, useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const showModal = useSecurityStore((s) => s.showModal);
    const setShowModal = useSecurityStore((s) => s.setShowModal);
    const setModalStep = useSecurityStore((s) => s.setModalStep);
    const step = useSecurityStore((s) => s.step);

    const [seedPhrase, setSeedPhrase] = useState<string[] | undefined>();
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    function handleClose() {
        setDialogToShow(null);
        setModalStep('ProtectIntro');
        setShowModal(false);
    }

    useEffect(() => {
        if (isOpen) {
            if (seedPhrase?.length && seedPhrase?.length > 0) return;
            invoke('get_seed_words').then((r) => {
                if (r?.length) {
                    setSeedPhrase(r);
                }
            });
        }
    }, [isOpen, seedPhrase?.length]);

    const content =
        step === 'VerifySeedPhrase' ? (
            <>
                <Title>{t('verifySeed.title')}</Title>
                <Subtitle>{t('verifySeed.text')}</Subtitle>
                <ContentWrapper>
                    <VerifySeedPhrase words={seedPhrase || []} />
                </ContentWrapper>
            </>
        ) : (
            <>
                <Title>{t('seedPhrase.title')}</Title>
                <Subtitle>{t('seedPhrase.text')}</Subtitle>
                <ContentWrapper>
                    <ViewSeedPhrase words={seedPhrase || []} />
                </ContentWrapper>
            </>
        );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>

                    <Content>
                        <StepChip>{`Step 1 of 2 `}</StepChip>
                        {content}
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
