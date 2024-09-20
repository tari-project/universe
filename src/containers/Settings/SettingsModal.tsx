import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Container, ContentContainer } from './SettingsModal.styles.ts';
import SettingsNavigation from '@app/containers/Settings/components/Navigation.tsx';
import { useState } from 'react';
import { MiningSettings } from '@app/containers/Settings/MiningSettings.tsx';
import { AnimatePresence } from 'framer-motion';
import { GeneralSettings } from '@app/containers/Settings/GeneralSettings.tsx';
import { ExperimentalSettings } from '@app/containers/Settings/ExperimentalSettings.tsx';

export const SETTINGS_TYPES = ['mining', 'general', 'experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

export default function SettingsModal() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

    const [activeSection, setActiveSection] = useState<SettingsType>('mining');

    const miningMarkup = activeSection === 'mining' ? <MiningSettings /> : null;
    const generalMarkup = activeSection === 'general' ? <GeneralSettings /> : null;
    const experimentalMarkup = activeSection === 'experimental' ? <ExperimentalSettings /> : null;

    return (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent $unPadded>
                <Container>
                    <SettingsNavigation activeSection={activeSection} onChangeActiveSection={setActiveSection} />
                    <ContentContainer>
                        <AnimatePresence mode="wait">
                            {miningMarkup}
                            {generalMarkup}
                            {experimentalMarkup}
                        </AnimatePresence>
                    </ContentContainer>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
