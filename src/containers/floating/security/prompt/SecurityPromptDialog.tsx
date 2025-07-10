import { Wrapper } from './styles.ts';
import { useTranslation } from 'react-i18next';
import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';

export default function SecurityPromptDialog() {
    const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'security';

    function handleClose() {
        setDialogToShow(null);
    }
    return (
        <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <AlertChip />
                    <p>{`hi`}</p>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
