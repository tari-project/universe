import { useTranslation } from 'react-i18next';
import { useConfigUIStore, useStagedSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Step, StepItem } from '@app/components/security/step/Step.tsx';
import { Content, Header, Subtitle, Title, Wrapper, CTA, CTAWrapper, ContentWrapper } from '../common.styles.ts';

import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';

export default function SecurityPromptDialog() {
    const { t } = useTranslation(['staged-security']);
    const { getSeedWords } = useGetSeedWords();
    const seedWordsComplete = useConfigUIStore((s) => s.was_staged_security_modal_shown);
    const showModal = useStagedSecurityStore((s) => s.showModal);
    const setShowModal = useStagedSecurityStore((s) => s.setShowModal);
    const setModalStep = useStagedSecurityStore((s) => s.setModalStep);
    const step = useStagedSecurityStore((s) => s.step);

    const isOpen = showModal && step === 'ProtectIntro';
    function handleClose() {
        setShowModal(false);
    }
    function handleClick() {
        if (!seedWordsComplete) {
            getSeedWords().then((seedWords) => {
                if (seedWords && seedWords?.length) {
                    setModalStep('SeedPhrase');
                }
            });
        } else {
            setModalStep('CreatePin');
        }
    }

    const steps: StepItem[] = [
        {
            stepNumber: 1,
            completed: !!seedWordsComplete,
            title: t('steps.title-seeds'),
            subtitle: t('steps.title-seeds'),
        },
        {
            stepNumber: 2,
            completed: false,
            title: t('steps.title-seeds'),
            subtitle: t('steps.title-seeds'),
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
                            <CTA onClick={handleClick}>{t('intro.title')}</CTA>
                            <TextButton onClick={handleClose}>{t('skip')}</TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
