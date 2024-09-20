import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Container, ContentContainer } from './SettingsModal.styles.ts';
import SettingsNavigation from '@app/containers/Settings/components/Navigation.tsx';

export default function SettingsModal() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);
    return (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent unPadded>
                <Container>
                    <SettingsNavigation />
                    <ContentContainer>meow</ContentContainer>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
