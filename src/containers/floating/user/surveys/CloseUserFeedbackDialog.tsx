import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';
import { setEarlyClosedDismissed, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { invoke } from '@tauri-apps/api/core';

export default function CloseUserFeedbackDialog() {
    const showCloseDialog = useUserFeedbackStore((s) => s.showCloseDialog);
    const toggleCloseDialog = useUserFeedbackStore((s) => s.toggleCloseDialog);

    function handleSkipped() {
        invoke('set_feedback_fields', {
            feedbackType: 'early_close',
            wasSent: false,
        }).then(() => {
            toggleCloseDialog();
            setEarlyClosedDismissed(true);
        });
    }
    return (
        <Dialog open={showCloseDialog} onOpenChange={toggleCloseDialog}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={toggleCloseDialog} />}>
                <UserSurvey type="close" onSkipped={handleSkipped} />
            </DialogContent>
        </Dialog>
    );
}
