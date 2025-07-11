import { useTranslation } from 'react-i18next';
import { setDialogToShow, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Step, StepItem } from '@app/components/security/step/Step.tsx';
import { Content, Header, Subtitle, Title, Wrapper, CTA, CTAWrapper, ContentWrapper } from '../common.styles.ts';

import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';

const steps: StepItem[] = [
    {
        stepNumber: 1,
        completed: false,
        title: `Back up your Seed Phrase`,
        subtitle: `Ensures you can recover funds if you lose your device`,
    },
    {
        stepNumber: 2,
        completed: false,
        title: `Set a secure PIN`,
        subtitle: `Prevents unauthorized wallet access`,
    },
];

export default function SecurityPromptDialog() {
    const { t } = useTranslation('wallet');
    const { getSeedWords } = useGetSeedWords();
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);

    const isOpen = showModal && step === 'ProtectIntro';
    function handleClose() {
        setDialogToShow(null);
    }
    function handleClick() {
        getSeedWords().then((seedWords) => {
            if (seedWords && seedWords?.length) {
                setModalStep('SeedPhrase');
            }
        });
    }
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <Content>
                        <AlertChip />
                        <Title>{`You've won your first Tari reward!\nLet’s secure your wallet.`}</Title>
                        <Subtitle>{`You now have your first Tari tokens. Let’s quickly protect your wallet in two easy steps.`}</Subtitle>
                        <ContentWrapper>
                            {steps.map((step) => (
                                <Step key={step.stepNumber + step.title} {...step} />
                            ))}
                        </ContentWrapper>
                        <CTAWrapper>
                            <CTA onClick={handleClick}>{`Secure my wallet`}</CTA>
                            <TextButton onClick={handleClose}>
                                {t('security.pin.enter', { context: 'skip' })}
                            </TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
