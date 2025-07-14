import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';

import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const { seedWords, getSeedWords, seedWordsFetching } = useGetSeedWords();
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    const [words, setWords] = useState<string[] | undefined>(seedWords);
    function handleClose() {
        setDialogToShow(null);
        setModalStep('ProtectIntro');
        setShowModal(false);
    }

    useEffect(() => {
        if (words?.length && words?.length > 0) return;
        getSeedWords().then((r) => {
            if (r?.length) {
                setWords(r);
            }
        });
    }, [getSeedWords, words]);

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
                        {seedWordsFetching && (
                            <ContentWrapper>
                                <LoadingDots />
                            </ContentWrapper>
                        )}
                        {content}
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
