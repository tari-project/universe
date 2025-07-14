import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';

import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useTransition } from 'react';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { invoke } from '@tauri-apps/api/core';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const [isPending, startTransition] = useTransition();

    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    const [words, setWords] = useState<string[] | undefined>([]);
    function handleClose() {
        setDialogToShow(null);
        setModalStep('ProtectIntro');
        setShowModal(false);
    }

    useEffect(() => {
        function loadSeedWords() {
            startTransition(async () => {
                try {
                    const seedwords = await invoke('get_seed_words');
                    console.debug(`seedwords= `, seedwords);
                    if (seedwords) {
                        setWords(seedwords);
                    }
                } catch (e) {
                    console.error('BLA', e);
                }
            });
        }

        if (!words?.length) {
            loadSeedWords();
        }
    }, [words?.length]);

    console.debug(`words= `, words);

    const content =
        step === 'VerifySeedPhrase' ? (
            <>
                <Title>{t('verifySeed.title')}</Title>
                <Subtitle>{t('verifySeed.text')}</Subtitle>
                <ContentWrapper>
                    <VerifySeedPhrase words={words || []} />
                </ContentWrapper>
            </>
        ) : (
            <>
                <Title>{t('seedPhrase.title')}</Title>
                <Subtitle>{t('seedPhrase.text')}</Subtitle>
                <ContentWrapper>
                    <ViewSeedPhrase words={words || []} />
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
                        {isPending ? (
                            <ContentWrapper>
                                <LoadingDots />
                            </ContentWrapper>
                        ) : (
                            content
                        )}
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
