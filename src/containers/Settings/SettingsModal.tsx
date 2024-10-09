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

import { SETTINGS_TYPES, SettingsType } from './types.ts';
import { Container, ContentContainer, HeaderContainer, SectionWrapper, variants } from './SettingsModal.styles.ts';
import { AirdropSettings } from './AirdropSettings.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export default function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);
    const airdropUIEnabled = useAppConfigStore((s) => s.airdrop_ui_enabled);

    const [activeSection, setActiveSection] = useState<SettingsType>(SETTINGS_TYPES[0]);

    const miningMarkup = activeSection === 'mining' ? <MiningSettings /> : null;
    const generalMarkup = activeSection === 'general' ? <GeneralSettings /> : null;
    const walletMarkup = activeSection === 'wallet' ? <WalletSettings /> : null;
    const experimentalMarkup = activeSection === 'experimental' ? <ExperimentalSettings /> : null;
    const airdropMarkup = airdropUIEnabled && activeSection === 'airdrop' ? <AirdropSettings /> : null;

    function onOpenChange() {
        if (isSettingsOpen) {
            setActiveSection(SETTINGS_TYPES[0]);
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
                                {airdropMarkup}
                            </SectionWrapper>
                        </AnimatePresence>
                    </ContentContainer>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
