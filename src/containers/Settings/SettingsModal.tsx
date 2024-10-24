import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';

import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

import { Typography } from '@app/components/elements/Typography.tsx';

import SettingsNavigation from './components/Navigation.tsx';

import { MiningSettings } from './sections/mining/MiningSettings.tsx';
import { GeneralSettings } from './sections/general/GeneralSettings.tsx';
import { ExperimentalSettings } from './sections/experimental/ExperimentalSettings.tsx';
import { WalletSettings } from './sections/wallet/WalletSettings.tsx';

import { SETTINGS_TYPES, SettingsType } from './types.ts';
import { Container, ContentContainer, HeaderContainer, SectionWrapper, variants } from './SettingsModal.styles.ts';
import { AirdropSettings } from './sections/airdrop/AirdropSettings.tsx';
import RestartDialog from '@app/components/dialogs/RestartDialog.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

const markups = {
    general: <GeneralSettings />,
    mining: <MiningSettings />,
    wallet: <WalletSettings />,
    airdrop: <AirdropSettings />,
    experimental: <ExperimentalSettings />,
};

export default function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);
    const setError = useAppStateStore((s) => s.setError);

    const [activeSection, setActiveSection] = useState<SettingsType>(SETTINGS_TYPES[0]);

    const sectionMarkup = markups[activeSection];

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
                    <Button size="large" onClick={() => setError('hi!')}>
                        Click for error!!
                    </Button>
                    <ContentContainer>
                        <HeaderContainer>
                            <Typography variant="h4">{`${t(`tabs.${activeSection}`)} ${t('settings')}`}</Typography>
                            <IconButton onClick={() => onOpenChange()}>
                                <IoClose size={18} />
                            </IconButton>
                        </HeaderContainer>

                        <AnimatePresence mode="wait">
                            <SectionWrapper variants={variants} key={activeSection}>
                                {sectionMarkup}
                            </SectionWrapper>
                        </AnimatePresence>
                    </ContentContainer>
                </Container>
                <RestartDialog />
            </DialogContent>
        </Dialog>
    );
}
