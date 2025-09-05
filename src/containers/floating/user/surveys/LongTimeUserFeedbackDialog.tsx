import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import {
    setEarlyClosedDismissed,
    setShowLongTimeDialog,
    useUserFeedbackStore,
} from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';

export default function LongTimeUserFeedbackDialog() {
    const showLongTimeDialog = useUserFeedbackStore((s) => s.showLongTimeDialog);

    function handleSubmit(skipped = false) {
        invoke('set_feedback_fields', {
            feedbackType: 'long_time_miner',
            wasSent: !skipped,
        }).then(() => {
            setEarlyClosedDismissed(true);
            setShowLongTimeDialog(false);
        });
    }

    return (
        <Dialog open={showLongTimeDialog} onOpenChange={() => handleSubmit(true)}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={() => handleSubmit(true)} />}>
                <UserSurvey type="long" onSkipped={() => handleSubmit(true)} onSuccess={handleSubmit} />
            </DialogContent>
        </Dialog>
    );
}
