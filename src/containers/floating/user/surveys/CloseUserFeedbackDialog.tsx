import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';
import { useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

export default function CloseUserFeedbackDialog() {
    const showCloseDialog = true; //useUserFeedbackStore((s) => s.showCloseDialog);
    const toggleCloseDialog = useUserFeedbackStore((s) => s.toggleCloseDialog);
    return (
        <Dialog open={showCloseDialog} onOpenChange={toggleCloseDialog}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={toggleCloseDialog} />}>
                <UserSurvey type="close" />
            </DialogContent>
        </Dialog>
    );
}
