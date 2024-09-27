import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Container, ContentContainer, HeaderContainer, SectionWrapper, variants } from './SettingsModal.styles.ts';
import SettingsNavigation from '@app/containers/Settings/components/Navigation.tsx';
import { useState } from 'react';
import { MiningSettings } from '@app/containers/Settings/MiningSettings.tsx';
import { AnimatePresence } from 'framer-motion';
import { GeneralSettings } from '@app/containers/Settings/GeneralSettings.tsx';
import { ExperimentalSettings } from '@app/containers/Settings/ExperimentalSettings.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IoClose } from 'react-icons/io5';
import { IconButton } from '@app/components/elements/Button.tsx';

export const SETTINGS_TYPES = ['mining', 'general', 'experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

export default function SettingsModal() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

    const [activeSection, setActiveSection] = useState<SettingsType>('mining');

    const miningMarkup = activeSection === 'mining' ? <MiningSettings /> : null;
    const generalMarkup = activeSection === 'general' ? <GeneralSettings /> : null;
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
                                {experimentalMarkup}
                            </SectionWrapper>
                        </AnimatePresence>
                    </ContentContainer>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
