import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';
import {
    setEarlyClosedDismissed,
    setShowCloseDialog,
    useUserFeedbackStore,
} from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

export default function CloseUserFeedbackDialog() {
    const showCloseDialog = useUserFeedbackStore((s) => s.showCloseDialog);

    function onClose() {
        setEarlyClosedDismissed(true);
        setShowCloseDialog(false);
    }
    return (
        <Dialog open={showCloseDialog} onOpenChange={onClose}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={onClose} />}>
                <UserSurvey type="close" onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}
