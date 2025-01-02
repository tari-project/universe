import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useCallback } from 'react';
import { ReleaseNotes } from '../Settings/sections';
import { Wrapper } from './styles';

export default function ReleaseNotesDialog() {
    const { t } = useTranslation('setup-view', { useSuspense: false });
    const open = useUIStore((s) => s.dialogToShow === 'releaseNotes');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <ReleaseNotes />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
