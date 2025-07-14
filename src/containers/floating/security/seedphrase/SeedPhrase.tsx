import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, StepChip, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const { seedWords, getSeedWords, seedWordsFetching, seedWordsFetched } = useGetSeedWords();
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    function handleClose() {
        setDialogToShow(null);
        setModalStep('ProtectIntro');
        setShowModal(false);
    }
    useEffect(() => {
        if (seedWordsFetching) return;
        if (!seedWordsFetched || !seedWords.length) {
            void getSeedWords();
        }
    }, [getSeedWords, seedWords.length, seedWordsFetched, seedWordsFetching]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>

                    <Content>
                        <StepChip>{`Step 1 of 2 `}</StepChip>
                        {step === 'VerifySeedPhrase' ? (
                            <>
                                <Title>{t('verifySeed.title')}</Title>
                                <Subtitle>{t('verifySeed.text')}</Subtitle>
                                <ContentWrapper>
                                    <VerifySeedPhrase words={seedWords} />
                                </ContentWrapper>
                            </>
                        ) : (
                            <>
                                <Title>{t('seedPhrase.title')}</Title>
                                <Subtitle>{t('seedPhrase.text')}</Subtitle>
                                <ContentWrapper>
                                    <ViewSeedPhrase words={seedWords} />
                                </ContentWrapper>
                            </>
                        )}
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
