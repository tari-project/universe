import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import UserSurvey from '@app/components/user/surveys/UserSurvey.tsx';

import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useUIStore } from '@app/store';
import { markFeedbackSurveyAsCompleted } from '@app/store/actions/appConfigStoreActions';
import { setShowFeedbackExitSurveyModal } from '@app/store/actions/uiStoreActions';

export default function ExitFeedbackSurveyDialog() {
    const isExitFeedbackSurveyModalOpen = useUIStore((s) => s.showFeedbackExitSurveyModal);

    function onClose() {
        markFeedbackSurveyAsCompleted();
        setShowFeedbackExitSurveyModal(false);
    }
    return (
        <Dialog open={isExitFeedbackSurveyModalOpen} onOpenChange={onClose}>
            <DialogContent variant="transparent" closeButton={<CloseButton onClick={onClose} />}>
                <UserSurvey type="close" onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}
