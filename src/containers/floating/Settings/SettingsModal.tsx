import { memo, useState } from 'react';
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
    ReleaseNotes,
} from './sections';

import { Container, ContentContainer, EndContainer, HeaderContainer, SectionWrapper } from './SettingsModal.styles.ts';
import { setIsSettingsOpen } from '@app/store';
import VersionChip from '@app/containers/navigation/components/VersionChip/VersionChip.tsx';

const SettingsModal = memo(function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [activeSection, setActiveSection] = useState<SettingsType>(SETTINGS_TYPES[0]);
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);

    const markups = {
        general: <GeneralSettings />,
        mining: <MiningSettings />,
        connections: <ConnectionsSettings />,
        p2p: <PoolMiningSettings />,
        wallet: <WalletSettings />,
        airdrop: <AirdropSettings />,
        experimental: <ExperimentalSettings />,
        releaseNotes: <ReleaseNotes />,
    };

    const sectionMarkup = markups[activeSection];

    function onOpenChange() {
        if (isSettingsOpen) {
            setActiveSection(SETTINGS_TYPES[0]);
        }
        setIsSettingsOpen(!isSettingsOpen);
    }

    const sectionTitle = t(`tabs.${activeSection}`);
    const title = activeSection === 'releaseNotes' ? sectionTitle : `${sectionTitle} ${t('settings')}`;

    return (
        <Dialog open={isSettingsOpen} onOpenChange={onOpenChange}>
            <DialogContent $unPadded>
                <Container>
                    <SettingsNavigation activeSection={activeSection} onChangeActiveSection={setActiveSection} />
                    <ContentContainer>
                        <HeaderContainer>
                            <Typography variant="h4">{title}</Typography>
                            <EndContainer>
                                <VersionChip />
                                <IconButton onClick={() => onOpenChange()}>
                                    <IoClose size={18} />
                                </IconButton>
                            </EndContainer>
                        </HeaderContainer>

                        <SectionWrapper key={activeSection}>{sectionMarkup}</SectionWrapper>
                    </ContentContainer>
                </Container>
                <RestartDialog />
            </DialogContent>
        </Dialog>
    );
});

export default SettingsModal;
