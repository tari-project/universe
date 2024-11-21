import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';

import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import RestartDialog from '@app/components/dialogs/RestartDialog.tsx';

import SettingsNavigation from './components/Navigation.tsx';
import { SETTINGS_TYPES, SettingsType } from './types.ts';
import {
    AirdropSettings,
    ConnectionsSettings,
    ExperimentalSettings,
    GeneralSettings,
    MiningSettings,
    PoolMiningSettings,
    WalletSettings,
} from './sections';

import { Container, ContentContainer, HeaderContainer, SectionWrapper, variants } from './SettingsModal.styles.ts';

const markups = {
    general: <GeneralSettings />,
    mining: <MiningSettings />,
    connections: <ConnectionsSettings />,
    p2p: <PoolMiningSettings />,
    wallet: <WalletSettings />,
    airdrop: <AirdropSettings />,
    experimental: <ExperimentalSettings />,
};

export default function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

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
