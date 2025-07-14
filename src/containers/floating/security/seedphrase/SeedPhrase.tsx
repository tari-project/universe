import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';

import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    const seedPhrase = useRef<string[]>(null);
    function handleClose() {
        setDialogToShow(null);
        setModalStep('ProtectIntro');
        setShowModal(false);
    }

    useEffect(() => {
        if (isOpen) {
            if (seedPhrase.current?.length && seedPhrase.current?.length > 0) return;
            invoke('get_seed_words').then((r) => {
                if (r?.length) {
                    console.debug(r);
                    seedPhrase.current = r;
                }
            });
        }
    }, [isOpen]);

    const content =
        step === 'VerifySeedPhrase' ? (
            <>
                <Title>{t('verifySeed.title')}</Title>
                <Subtitle>{t('verifySeed.text')}</Subtitle>
                <ContentWrapper>
                    <VerifySeedPhrase words={seedPhrase.current || []} />
                </ContentWrapper>
            </>
        ) : (
            <>
                <Title>{t('seedPhrase.title')}</Title>
                <Subtitle>{t('seedPhrase.text')}</Subtitle>
                <ContentWrapper>
                    <ViewSeedPhrase words={seedPhrase.current || []} />
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
