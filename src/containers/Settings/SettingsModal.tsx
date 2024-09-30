import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';

import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import SettingsNavigation from './components/Navigation.tsx';

import { MiningSettings } from './MiningSettings.tsx';
import { GeneralSettings } from './GeneralSettings.tsx';
import { ExperimentalSettings } from './ExperimentalSettings.tsx';
import { WalletSettings } from './WalletSettings.tsx';

import { SettingsType } from './types.ts';
import { Container, ContentContainer, HeaderContainer, SectionWrapper, variants } from './SettingsModal.styles.ts';

export default function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

    const [activeSection, setActiveSection] = useState<SettingsType>('mining');

    const miningMarkup = activeSection === 'mining' ? <MiningSettings /> : null;
    const generalMarkup = activeSection === 'general' ? <GeneralSettings /> : null;
    const walletMarkup = activeSection === 'wallet' ? <WalletSettings /> : null;
    const experimentalMarkup = activeSection === 'experimental' ? <ExperimentalSettings /> : null;

    function onOpenChange() {
        if (isSettingsOpen) {
            setActiveSection('mining');
        }
        setIsSettingsOpen(!isSettingsOpen);
    }

    return (
        <Dialog open={isSettingsOpen} onOpenChange={onOpenChange}>
            <DialogContent $unPadded>
                <Container>
                    <SettingsNavigation activeSection={activeSection} onChangeActiveSection={setActiveSection} />
                    <ContentContainer>
                        <HeaderContainer>
                            <Typography variant="h4">{`${t(activeSection)} ${t('settings')}`}</Typography>
                            <IconButton onClick={() => onOpenChange()}>
                                <IoClose size={18} />
                            </IconButton>
                        </HeaderContainer>

                        <AnimatePresence mode="wait">
                            <SectionWrapper variants={variants} key={activeSection}>
                                {miningMarkup}
                                {generalMarkup}
                                {walletMarkup}
                                {experimentalMarkup}
                            </SectionWrapper>
                        </AnimatePresence>
                    </ContentContainer>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
