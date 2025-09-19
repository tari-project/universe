import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';

import { setError, useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);

    const isOpen = modal === 'verify_seedphrase';

    const [seedPhrase, setSeedPhrase] = useState<string[] | undefined>();
    const [isVerify, setIsVerify] = useState(false);

    function handleClose() {
        setModal(null);
    }

    useEffect(() => {
        if (isOpen) {
            if (seedPhrase?.length && seedPhrase?.length > 0) return;
            invoke('get_seed_words')
                .then((r) => {
                    if (r?.length) {
                        setSeedPhrase(r);
                        setModal('verify_seedphrase');
                    }
                })
                .catch((error) => {
                    const errorMessage = error as unknown as string;
                    console.error('Error fetching seed words:', errorMessage);
                    if (
                        !errorMessage.includes('User canceled the operation') &&
                        !errorMessage.includes('PIN entry cancelled')
                    ) {
                        setError(errorMessage);
                    }
                });
        }
    }, [isOpen, seedPhrase?.length, setModal]);

    const content = isVerify ? (
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
                <ViewSeedPhrase words={seedPhrase || []} onContinue={() => setIsVerify(true)} />
            </ContentWrapper>
        </>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>

                    <Content>
                        <StepChip>{t('steps.chip', { step: 1, total: 2 })}</StepChip>
                        {content}
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
