import { ViewSeedPhrase } from '@app/components/security/seedphrase/ViewSeedPhrase.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, Title, Wrapper } from '../common.styles.ts';
import { VerifySeedPhrase } from '@app/components/security/seedphrase/VerifySeedPhrase.tsx';

export default function SeedPhrase() {
    const { seedWords } = useGetSeedWords();
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const step = useStagedSecurityStore((s) => s.step);
    const isOpen = showModal && (step === 'SeedPhrase' || step === 'VerifySeedPhrase');

    function handleClose() {
        setDialogToShow(null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    {step === 'VerifySeedPhrase' ? (
                        <Content>
                            <Title>{`Write down your seed phrase and store it somewhere safe`}</Title>
                            <VerifySeedPhrase words={seedWords} />
                        </Content>
                    ) : (
                        <Content>
                            <Title>{`Write down your seed phrase and store it somewhere safe`}</Title>
                            <ViewSeedPhrase words={seedWords} />
                        </Content>
                    )}
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
