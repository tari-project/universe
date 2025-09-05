import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';
import {
    setEarlyClosedDismissed,
    setShowCloseDialog,
    useUserFeedbackStore,
} from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { invoke } from '@tauri-apps/api/core';

export default function CloseUserFeedbackDialog() {
    const showCloseDialog = useUserFeedbackStore((s) => s.showCloseDialog);
    function handleSubmit(skipped = false) {
        invoke('set_feedback_fields', {
            feedbackType: 'early_close',
            wasSent: !skipped,
        }).then(() => {
            setEarlyClosedDismissed(true);
            setShowCloseDialog(false);
        });
    }

    return (
        <Dialog open={showCloseDialog} onOpenChange={() => handleSubmit(true)}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={() => handleSubmit(true)} />}>
                <UserSurvey type="close" onSkipped={() => handleSubmit(true)} onSuccess={handleSubmit} />
            </DialogContent>
        </Dialog>
    );
}
