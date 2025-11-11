import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { setShowLongTimeDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';

export default function LongTimeUserFeedbackDialog() {
    const showLongTimeDialog = useUserFeedbackStore((s) => s.showLongTimeDialog);
    function onClose() {
        setShowLongTimeDialog(false);
    }

    return (
        <Dialog open={showLongTimeDialog} onOpenChange={onClose}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={onClose} />}>
                <UserSurvey type="long" onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}
