import { useUIStore } from '@app/store/useUIStore';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useCallback } from 'react';
import { ReleaseNotes } from '../Settings/sections';
import { Button, ButtonWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';

export default function ReleaseNotesDialog() {
    const open = useUIStore((s) => s.dialogToShow === 'releaseNotes');
    const updateLastShownReleaseNotesVersion = useAppStateStore((s) => s.updateLastShownReleaseNotesVersion);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const { t } = useTranslation('components', { useSuspense: false });

    const handleClose = useCallback(async () => {
        await updateLastShownReleaseNotesVersion();
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <Title>{t('releaseNotesDialog.title')}</Title>
                    <ReleaseNotes noHeader={true} showScrollBars={true} />
                    <ButtonWrapper>
                        <Button onClick={handleClose}>
                            <span>{t('releaseNotesDialog.close')}</span>
                        </Button>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
