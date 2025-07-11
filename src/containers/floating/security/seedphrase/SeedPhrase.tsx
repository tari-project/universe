import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, Header, Subtitle, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function SeedPhrase() {
    const { t } = useTranslation('staged-security');
    const { seedWords, getSeedWords } = useGetSeedWords();
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    function handleClose() {
        setDialogToShow(null);
    }

    useEffect(() => {
        if (!seedWords.length) {
            void getSeedWords();
        }
    }, [getSeedWords, seedWords.length]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    {step === 'VerifySeedPhrase' ? (
                        <Content>
                            <Title>{t('verifySeed.title')}</Title>
                            <Subtitle>{t('verifySeed.text')}</Subtitle>
                            <ContentWrapper>
                                <VerifySeedPhrase words={seedWords} />
                            </ContentWrapper>
                        </Content>
                    ) : (
                        <Content>
                            <Title>{t('seedPhrase.title')}</Title>
                            <Subtitle>{t('seedPhrase.text')}</Subtitle>
                            <ContentWrapper>
                                <ViewSeedPhrase words={seedWords} />
                            </ContentWrapper>
                        </Content>
                    )}
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
